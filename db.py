import duckdb
import pandas as pd
import sys

# Initialize DuckDB
conn = duckdb.connect('./db/feedback.db')

try:
    # Create a table
    conn.execute("""
    CREATE TABLE feedback (
        sid VARCHAR,
        feedback_1990 VARCHAR,
        feedback_1992 VARCHAR,
        feedback_1993 VARCHAR,
        feedback_1994 VARCHAR,
        feedback_1995 VARCHAR,
        feedback_1996 VARCHAR,
        feedback_1997 VARCHAR,
        feedback_1998 VARCHAR,
        feedback_1999 VARCHAR,
        feedback_2000 VARCHAR,
        feedback_2001 VARCHAR,
        feedback_2002 VARCHAR,
        feedback_2003 VARCHAR,
        feedback_2004 VARCHAR,
        feedback_2005 VARCHAR,
        feedback_2006 VARCHAR,
        feedback_2007 VARCHAR,
        feedback_2008 VARCHAR,
        feedback_2009 VARCHAR,
        feedback_2010 VARCHAR,
        feedback_2011 VARCHAR,
        feedback_2012 VARCHAR,
        feedback_2013 VARCHAR,
        feedback_2014 VARCHAR,
        feedback_2015 VARCHAR,
        feedback_2016 VARCHAR,
        feedback_2017 VARCHAR,
        feedback_2018 VARCHAR,
        feedback_2019 VARCHAR,
        feedback_2020 VARCHAR,
        feedback_2021 VARCHAR,
        feedback_2022 VARCHAR,
        feedback_2023 VARCHAR,
        q1 VARCHAR,
        q2 VARCHAR,
        q3 VARCHAR,
        q4 VARCHAR,
        name VARCHAR,
        comment VARCHAR
    )
    """)
except:
    pass

def insert_data(data):

    # Manually specify the order of columns in your database
    columns_order = ['sid'] + [f'{year}feedback' for year in range(1990, 2024) if year != 1991] + ['q1', 'q2', 'q3', 'q4', 'name', 'comment']

    # Prepare values
    values = ', '.join("'" + str(data.get(key, '')) + "'" for key in columns_order)

    # Prepare SQL statement
    sql = f"""
    INSERT INTO feedback VALUES ({values})
    """

    # Execute the statement
    conn.execute(sql)
    conn.commit()

def read_data():
    return conn.execute("SELECT * FROM feedback").fetch_df()