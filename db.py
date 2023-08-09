import psycopg2
from psycopg2.extras import RealDictCursor
from config import Config
import pandas.io.sql as psql


def kon_connection():
    c = psycopg2.connect(user=Config.POSTGRES_CREDS["user"],
                         password=Config.POSTGRES_CREDS["password"],
                         host=Config.POSTGRES_CREDS["host"],
                         port=Config.POSTGRES_CREDS["port"],
                         database=Config.POSTGRES_CREDS["database"])
    return c


def close_connection(conn, cur):
    if conn:
        if cur:
            cur.close()
        conn.close()


def connect():
    conn = kon_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    print("Reconnected database!")
    return conn, cur


def insert_data(data):
    conn, cur = connect()
    # Manually specify the order of columns in your database
    columns_order = ['sid'] + [f'{year}feedback' for year in range(1990, 2024) if year != 1991] + ['q1', 'q2', 'q3', 'q4', 'name', 'comment']

    # Prepare values
    values = ', '.join("'" + str(data.get(key, '')) + "'" for key in columns_order)

    # Prepare SQL statement
    sql = f"""
    INSERT INTO reptile.feedback VALUES ({values})
    """

    # Execute the statement
    cur.execute(sql)
    conn.commit()
    close_connection(conn, cur)


def read_data():
    conn, cur = connect()
    df = psql.read_sql("SELECT * FROM reptile.feedback", conn)
    close_connection(conn, cur)
    return df
