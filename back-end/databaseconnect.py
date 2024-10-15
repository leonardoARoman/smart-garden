from flask import Flask, jsonify, request
import mysql.connector
from mysql.connector import Error
from flask_cors import CORS, cross_origin

# Initialize the Flask application
app = Flask(__name__)
CORS(app)

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

@cross_origin()
@app.route('/ping', methods=['GET'])
def ping():
    connection = create_connection()
    connection.close()
    return jsonify("pong")

# Get records for all 8 analog sensors mesuring soil moisture and temperature
@cross_origin()
@app.route('/soil-sensors', methods=['GET'])
def soil_sensors():
    connection = create_connection()
    cursor = connection.cursor(dictionary=True)
    cursor.execute("SELECT * FROM soil_sensors")
    data = cursor.fetchall()
    cursor.close()
    connection.close()

    return jsonify(data)

# Get water flow rate history
@cross_origin()
@app.route('/water-meter', methods=['GET'])
def water_meter():
    connection = create_connection()
    cursor = connection.cursor(dictionary=True)
    cursor.execute("SELECT * FROM water_meter")
    data = cursor.fetchall()
    cursor.close()
    connection.close()

    return jsonify(data)

# Get records for all digital sensors mesuring ambient temperature, humidity, atmospheric pressure and sunlight rate.
@cross_origin()
@app.route('/ambient-sensors', methods=['GET'])
def ambient_sensors():
    connection = create_connection()
    cursor = connection.cursor(dictionary=True)
    cursor.execute("SELECT * FROM ambient_sensors")
    data = cursor.fetchall()
    cursor.close()
    connection.close()

    return jsonify(data)

# Run the Flask app
if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)
