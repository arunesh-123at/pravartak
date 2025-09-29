#!/usr/bin/env python3
"""
Inspect the model to understand what features it expects
"""
import joblib
import numpy as np
import os

# Load the model
model_path = "/Users/anshkumar/Desktop/copy/model/model_pipeline.joblib"

try:
    model = joblib.load(model_path)
    print("✅ Model loaded successfully")
    print(f"Model type: {type(model)}")
    
    # If it's a pipeline, examine the steps
    if hasattr(model, 'steps'):
        print("\nPipeline steps:")
        for i, (name, step) in enumerate(model.steps):
            print(f"  {i}: {name} -> {type(step)}")
            
        # Get the preprocessor (first step)
        preprocessor = model.steps[0][1]
        print(f"\nPreprocessor: {type(preprocessor)}")
        
        if hasattr(preprocessor, 'transformers'):
            print("Transformers:")
            for name, transformer, columns in preprocessor.transformers:
                print(f"  {name}: {transformer} -> columns: {columns}")
                
        # Let's see what happens with our current input
        test_input = [[7.5, 85, 0, 1]]  # cgpa, attendance, fee_status_encoded, backlogs
        print(f"\nTesting with input: {test_input}")
        
        try:
            prediction = model.predict(test_input)
            print(f"Prediction successful: {prediction}")
        except Exception as e:
            print(f"Prediction failed: {e}")
            
        # Try to understand what features are expected
        if hasattr(preprocessor, 'feature_names_in_'):
            print(f"Expected features: {preprocessor.feature_names_in_}")
        
        # Let's try with different number of features
        for num_features in [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]:
            test_input_var = [np.random.rand(num_features).tolist()]
            try:
                pred = model.predict(test_input_var)
                print(f"✅ {num_features} features work: {pred}")
                break
            except Exception as e:
                print(f"❌ {num_features} features: {str(e)[:100]}...")
                
except Exception as e:
    print(f"❌ Failed to load model: {e}")