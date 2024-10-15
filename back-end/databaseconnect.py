from flask import Flask, jsonify, request
import mysql.connector
from mysql.connector import Error

# Initialize the Flask application
app = Flask(__name__)

# MySQL connection configuration
def create_connection():
    connection = None
    try:
        connection = mysql.connector.connect(
            host="localhost",  # Replace with your MySQL host
            user="root",       # Replace with your MySQL user
            password="password",  # Replace with your MySQL password
            database="smartgarden"  # Replace with your MySQL database name
        )
        if connection.is_connected():
            print("Connected to MySQL database")
    except Error as e:
        print(f"Error while connecting to MySQL: {e}")
    
    return connection

# Get records for all 8 analog sensors mesuring soil moisture and temperature
@app.route('/soil-sensors', methods=['GET'])
def get_users():
    connection = create_connection()
    cursor = connection.cursor(dictionary=True)
    cursor.execute("SELECT * FROM soil_sensors")
    users = cursor.fetchall()
    cursor.close()
    connection.close()
    
    return jsonify(users)

# Get water flow rate history
@app.route('/water-meter', methods=['GET'])
def get_users():
    connection = create_connection()
    cursor = connection.cursor(dictionary=True)
    cursor.execute("SELECT * FROM water_meter")
    users = cursor.fetchall()
    cursor.close()
    connection.close()
    
    return jsonify(users)

# Get records for all digital sensors mesuring ambient temperature, humidity, atmospheric pressure and sunlight rate.
@app.route('/ambient-sensors', methods=['GET'])
def get_users():
    connection = create_connection()
    cursor = connection.cursor(dictionary=True)
    cursor.execute("SELECT * FROM ambient_sensors")
    users = cursor.fetchall()
    cursor.close()
    connection.close()
    
    return jsonify(users)

# Run the Flask app
if __name__ == '__main__':
    app.run(debug=True)
