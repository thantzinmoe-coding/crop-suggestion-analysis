import os
import pandas as pd
import math

base_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(base_dir, '..'))

def predict_crop(soil_pH, rainfall_mm, temperature_c, language='en', field_area_acres=1.0):
    # Load correct dataset based on language
    filename = 'plants.csv' if language == 'en' else 'plants_mm.csv'
    data_path = os.path.join(project_root, 'data', filename)
    
    if not os.path.exists(data_path):
        return []
    
    df = pd.read_csv(data_path)
    
    # Clean temperature columns (handle "°C" strings if present)
    def clean_temp(x):
        try:
            if isinstance(x, str):
                return float(x.replace('°C', '').strip())
            return float(x)
        except:
            return None

    df['low_t'] = df['lowest_temp'].apply(clean_temp)
    df['high_t'] = df['highest_temp'].apply(clean_temp)
    
    # Drop rows without valid temp bounds
    df = df.dropna(subset=['low_t', 'high_t'])
    
    # Calculate difference between user temp and optimal temp (midpoint)
    df['ideal_temp'] = (df['low_t'] + df['high_t']) / 2
    df['temp_diff'] = abs(df['ideal_temp'] - temperature_c)
    
    # Calculate match percentage
    def calculate_match_score(row):
        temp_diff = row['temp_diff']
        range_size = (row['high_t'] - row['low_t']) / 2
        
        if range_size <= 0:
            range_size = 1.0
            
        # 1. Temperature Score (Max 100)
        # Drops from 100 at ideal temp down to 50 at the edge of survival
        if temp_diff <= range_size:
            temp_score = 100 - (temp_diff / range_size) * 50
        else:
            # Penalize heavily if outside bounds
            temp_score = 50 - ((temp_diff - range_size) * 15)
            
        # 2. Soil pH Penalty
        # Most plants prefer ~6.5. Subtract points for extreme acidity/alkalinity
        ph_diff = abs(6.5 - soil_pH)
        ph_penalty = ph_diff * 8  # e.g., pH 8.0 -> diff 1.5 -> -12 points
        
        # 3. Water/Rainfall Penalty (heuristic)
        # If water necessity is high but rainfall is low
        water_req = 1
        try:
            water_req = float(row.get('water_necessity (1Lcup/day)', 1))
        except:
            pass
            
        water_penalty = 0
        if water_req > 2 and rainfall_mm < 20:
            water_penalty = 10  # Needs water but no rain
            
        final_score = temp_score - ph_penalty - water_penalty
        return max(15, min(98, int(final_score))) # Clamp between 15% and 98% to look realistic

    df['match_score'] = df.apply(calculate_match_score, axis=1)
    
    # Filter strictly viable crops (within temp bounds + 2 degree tolerance)
    viable_df = df[(temperature_c >= df['low_t'] - 2) & (temperature_c <= df['high_t'] + 2)].copy()
    
    if viable_df.empty:
        # Fallback: Just take the ones closest to optimal temp
        viable_df = df.copy()
        
    # Sort by match score (descending)
    viable_df = viable_df.sort_values(by='match_score', ascending=False)
    
    # Drop duplicates (since the CSV has multiple entries per plant across different states)
    unique_plants = viable_df.drop_duplicates(subset=['plant_name']).head(3)
    
    results = []
    for _, row in unique_plants.iterrows():
        # Calculate estimated plant capacity
        # 1 Acre = 43,560 sq ft. Assume 80% usable field space.
        min_area = row.get('min_area_square_feet', 1)
        try:
            min_area = float(min_area)
            if math.isnan(min_area) or min_area <= 0:
                min_area = 1
        except:
            min_area = 1
            
        capacity = int((field_area_acres * 43560 * 0.8) / min_area)
        
        results.append({
            "name": str(row['plant_name']).strip(),
            "estimated_capacity": capacity,
            "match_score": int(row['match_score'])
        })
        
    return results
