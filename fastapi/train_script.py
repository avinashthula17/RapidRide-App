
import sys
import os

# Add current directory to path
sys.path.append(os.getcwd())

try:
    from app.models.trainer import ETAModelTrainer
    
    print("🚀 Starting training...")
    trainer = ETAModelTrainer()
    trainer.train('data/training_rides.csv')
    print("✅ Training complete!")
except Exception as e:
    print(f"❌ Error: {e}")
