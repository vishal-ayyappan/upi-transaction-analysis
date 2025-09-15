import csv
import random
from datetime import datetime, timedelta

# --- Configuration ---
NUM_RECORDS = 10000
FILENAME = "messy_transactions.csv"
CUSTOMER_IDS = [f"cust_{100+i}" for i in range(15)]
# NEW: Define a wider date range
START_DATE = datetime(2025, 1, 1)
END_DATE = datetime(2025, 9, 15) # Today's date

# --- Main Script ---
def generate_messy_data():
    """Generates a messy CSV file with a wide date range to test data cleaning."""
    header = ['transaction_id', 'customer_id', 'amount', 'timestamp']
    records = []
    
    # NEW: Calculate the total number of days in the range
    total_days_in_range = (END_DATE - START_DATE).days

    for i in range(NUM_RECORDS):
        # Create a base record
        record = {
            'transaction_id': f"txn_{2025000 + i}",
            'customer_id': random.choice(CUSTOMER_IDS),
            'amount': round(random.uniform(50.0, 600.0), 2),
        }
        
        # --- NEW: Generate a random timestamp within the Jan-Sep range ---
        random_days = random.randint(0, total_days_in_range)
        random_hours = random.randint(8, 22) # Simulate cafe open hours
        random_minutes = random.randint(0, 59)
        
        timestamp = START_DATE + timedelta(
            days=random_days,
            hours=random_hours,
            minutes=random_minutes
        )
        record['timestamp'] = timestamp.strftime('%Y-%m-%d %H:%M:%S')

        # --- Introduce Messiness (logic remains the same) ---
        prob = random.random()
        
        if prob < 0.05:
            record['amount'] = ''
        elif prob < 0.10:
            record['amount'] = 'invalid_price'
        elif prob < 0.15:
            record['timestamp'] = ''
        elif prob < 0.20:
            if records:
                record['transaction_id'] = records[-1]['transaction_id']
        elif prob < 0.22:
            record['amount'] = -100.0
            
        records.append(record)

    # --- Write to CSV ---
    with open(FILENAME, 'w', newline='') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=header)
        writer.writeheader()
        writer.writerows(records)

    print(f"✅ Successfully generated messy data in '{FILENAME}' with {NUM_RECORDS} records from {START_DATE.date()} to {END_DATE.date()}.")

if __name__ == '__main__':
    generate_messy_data()