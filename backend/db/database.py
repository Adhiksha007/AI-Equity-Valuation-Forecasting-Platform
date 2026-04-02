"""
database.py
-----------
SQLite via sqlite3 – connection management.
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "stock_platform.db")

def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn
