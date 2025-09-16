from flask import Flask, request, jsonify, send_from_directory
import pandas as pd # Import pandas

# Initialize the Flask application
app = Flask(__name__)

# Global variable to store cleaned dataframe
cleaned_df = None

# --- Static File Serving ---
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/styles.css')
def styles():
    return send_from_directory('.', 'styles.css')

@app.route('/scripts.js')
def scripts():
    return send_from_directory('.', 'scripts.js')

# --- API Endpoint ---
@app.route('/analyze', methods=['POST'])
def analyze_data():
    global cleaned_df
    
    file_provided = 'file' in request.files and request.files['file'].filename != ''
    
    if file_provided:
        file = request.files['file']
        try:
            print(f"Received file: {file.filename}")
            # --- Data Cleaning with Pandas ---
            file.stream.seek(0)  # Ensure stream is at the beginning
            df = pd.read_csv(file.stream)
            initial_records = len(df)
            print(f"Initial dataframe shape: {df.shape}")
            
            # 1. Drop rows with missing essential data (amount or timestamp)
            df.dropna(subset=['amount', 'timestamp'], inplace=True)
            print(f"After dropping missing essentials: {df.shape}")
            
            # 2. Correct data types, coercing errors to NaT/NaN
            df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')
            df['amount'] = pd.to_numeric(df['amount'], errors='coerce')
            print(f"After type conversion: {df.shape}")
            
            # 3. Drop rows where type conversion failed
            df.dropna(subset=['amount', 'timestamp'], inplace=True)
            print(f"After dropping invalid types: {df.shape}")

            # 4. Remove duplicate transactions based on a unique identifier
            if 'transaction_id' in df.columns:
                df.drop_duplicates(subset=['transaction_id'], keep='first', inplace=True)
                print(f"After removing duplicates: {df.shape}")
                
            # 5. Filter out invalid transaction amounts
            df = df[df['amount'] > 0]
            final_records = len(df)
            print(f"After filtering positive amounts: {df.shape}")
            
            cleaned_df = df.copy()  # Store the cleaned dataframe
            
        except Exception as e:
            print(f"Error processing file: {str(e)}")
            return jsonify({"error": f"An error occurred: {str(e)}"}), 500
    
    if cleaned_df is None:
        return jsonify({"error": "No data available. Please upload a file first."}), 400
    
    # Get date filters
    start_date = request.form.get('start_date')
    end_date = request.form.get('end_date')
    
    df = cleaned_df.copy()  # Work on a copy
    
    if start_date:
        start_date = pd.to_datetime(start_date)
        df = df[df['timestamp'] >= start_date]
    
    if end_date:
        end_date = pd.to_datetime(end_date) + pd.Timedelta(days=1)  # Include the end date
        df = df[df['timestamp'] < end_date]
    
    # --- Start Analysis on the Filtered DataFrame ---
    if df.empty:
        print("DataFrame is empty after filtering")
        # Return empty results instead of error for filtering
        if not file_provided:
            analysis_results = {
                'total_revenue': 0.0,
                'total_transactions': 0,
                'avg_transaction_value': 0.0,
                'top_customers': [],
                'peak_hours': {'labels': [f"{h}:00" for h in range(24)], 'data': [0] * 24},
                'trends': {'labels': [], 'data': []}
            }
            return jsonify(analysis_results)
        else:
            return jsonify({"error": "No data found for the selected date range."}), 400

    total_revenue = float(df['amount'].sum())
    total_transactions = int(len(df))
    avg_transaction_value = float(total_revenue / total_transactions)

    # Top Customers
    customer_data = df.groupby('customer_id')['amount'].agg(['sum', 'count']).reset_index()
    customer_data.columns = ['customer', 'total_spent', 'visits']
    customer_data['total_spent'] = customer_data['total_spent'].astype(float)
    customer_data['visits'] = customer_data['visits'].astype(int)
    top_customers = customer_data.sort_values(by='total_spent', ascending=False).head(5).to_dict('records')

    # Peak Hours Analysis
    hourly_transactions = df['timestamp'].dt.hour.value_counts().sort_index()
    peak_hours_labels = [f"{h}:00" for h in range(24)]
    peak_hours_data = [int(hourly_transactions.get(h, 0)) for h in range(24)]

    # Daily Trends Analysis
    daily_revenue = df.set_index('timestamp').resample('D')['amount'].sum()
    trends_labels = daily_revenue.index.strftime('%Y-%m-%d').tolist()
    trends_data = [float(x) for x in daily_revenue.values.tolist()]
    
    analysis_results = {
        'total_revenue': round(total_revenue, 2),
        'total_transactions': total_transactions,
        'avg_transaction_value': round(avg_transaction_value, 2),
        'top_customers': top_customers,
        'peak_hours': {'labels': peak_hours_labels, 'data': peak_hours_data},
        'trends': {'labels': trends_labels, 'data': trends_data},
    }
    
    if file_provided:
        analysis_results['cleaning_summary'] = {
            'initial_records': initial_records,
            'final_records': final_records,
            'records_removed': initial_records - final_records
        }
    
    return jsonify(analysis_results)

if __name__ == '__main__':
    app.run(debug=True, port=8000)