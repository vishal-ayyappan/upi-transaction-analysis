# UPI Insights Dashboard

A simple, fast, and powerful web application that helps small business owners gain **data-driven insights** from their UPI transaction history.  

Users can upload a raw CSV export, and the dashboard automatically **cleans the data** and generates **interactive visualizations**.

---

## 🚀 Features
- Upload raw UPI transaction CSVs
- Automated data cleaning using **Pandas**
- Interactive charts and dashboards with **Chart.js**
- Lightweight backend powered by **Flask**
- Clean and responsive UI with **Tailwind CSS**

---

## 🛠️ Tech Stack

**Frontend**
- **HTML5**  
- **Tailwind CSS** -> clean, modern, and responsive design  
- **JavaScript** -> user interactions & API communication  
- **Chart.js** -> interactive data visualizations  

**Backend**
- **Python** -> server-side logic  
- **Flask** -> lightweight API framework  
- **Pandas** -> data cleaning, manipulation, and analysis  

---

##  How to Use

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd <repo-folder>

2. **Install Depenedencies**
   ```bash
   pip install -r requirements.txt

3. **Start the backend server**
   ```bash
    python app.py

---

**Make sure your CSV export includes columns like**:
- **Date**
- **Transaction ID**
- **Amount**
- **Type (Credit/Debit)**

