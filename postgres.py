import psycopg2
import pandas as pd
con = psycopg2.connect(host = 'pgdb12.iri.columbia.edu',
database = 'DesignEngine',
user = 'fist',
password = 'MonellIRI')

# cur = con.cursor()
# cur.execute("SELECT * from badyears_drought_ethiopia_compiled_forms limit 10")
# rows = cur.fetchall()

dataFrame = pd.read_sql("select * from badyears_drought_ethiopia_compiled_forms", con)
print(dataFrame )
print("Database opened successfully")