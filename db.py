import sqlite3
import pandas as pd
import sys


def query_db(sql):
    try:
        conn = sqlite3.connect('db/fist.db')
        df = pd.read_sql_query(sql, conn)
        df = df.apply(pd.to_numeric, errors='ignore')
    except:
        print("Unexpected error:", sys.exc_info()[0])
        raise
    return df

