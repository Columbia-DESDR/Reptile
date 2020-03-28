import sqlite3
import pandas as pd
import sys


# df = pd.read_sql_query("SELECT * FROM customers limit 3", conn)
# df = pd.read_sql_query("SELECT * FROM acme limit 3", conn)
def query_db(sql):
    try:
        conn = sqlite3.connect('db/fist.db')
        df = pd.read_sql_query(sql, conn)
        df = df.apply(pd.to_numeric, errors='ignore')
    except:
        print("Unexpected error:", sys.exc_info()[0])
        raise
    return df

# try:
#     df = pd.read_sql_query("SELECT * FROM customesrs limit 3", conn)
# except:
#     print("Unexpected error:", sys.exc_info()[0])

# c = conn.cursor()

# Create table
# c.execute('''CREATE TABLE stocks
#              (date text, trans text, symbol text, qty real, price real)''')

# Save (commit) the changes
# conn.commit()

# We can also close the connection if we are done with it.
# Just be sure any changes have been committed or they will be lost.
# conn.close()

