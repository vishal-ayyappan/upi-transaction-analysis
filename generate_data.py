import csv
import random
from datetime import datetime, timedelta

# --- Configuration ---
NUM_RECORDS = 10000
FILENAME = "messy_transactions.csv"
CUSTOMER_IDS = [f"cust_{100+i}" for i in range(15)]
START_DATE = datetime(2025, 9, 1)

# --- Main Script ---
def generate_messy_data():
    """Generates a messy CSV file to test data cleaning."""
    header = ['transaction_id', 'customer_id', 'amount', 'timestamp']
    records = []

    for i in range(NUM_RECORDS):
        # Create a base record
        record = {
            'transaction_id': f"txn_{2025000 + i}",
            'customer_id': random.choice(CUSTOMER_IDS),
            'amount': round(random.uniform(50.0, 600.0), 2),
            'timestamp': (START_DATE + timedelta(
                days=random.randint(0, 14),
                hours=random.randint(8, 22),
                minutes=random.randint(0, 59)
            )).strftime('%Y-%m-%d %H:%M:%S')
        }
        
        # --- Introduce Messiness ---
        prob = random.random() # Generate a random float between 0.0 and 1.0
        
        if prob < 0.05: # 5% chance of missing amount
            record['amount'] = ''
        elif prob < 0.10: # 5% chance of invalid amount
            record['amount'] = 'invalid_price'
        elif prob < 0.15: # 5% chance of missing timestamp
            record['timestamp'] = ''
        elif prob < 0.20: # 5% chance of a duplicate transaction
            if records: # Ensure there is a previous record to duplicate
                record['transaction_id'] = records[-1]['transaction_id']
        elif prob < 0.22: # 2% chance of negative amount
            record['amount'] = -100.0
            
        records.append(record)

    # --- Write to CSV ---
    with open(FILENAME, 'w', newline='') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=header)
        writer.writeheader()
        writer.writerows(records)

    print(f"✅ Successfully generated messy data in '{FILENAME}' with {NUM_RECORDS} records.")

if __name__ == '__main__':
    generate_messy_data()