import pandas as pd

# df = pd.read_csv("./db/heatmap_data.csv")
# df = pd.read_csv("./db/intitiate_cleaned.csv")

# df.groupby(level=0).apply(lambda x: x.to_json(orient='records'))

# df.groupby('Village').apply(lambda x: x[['year','rank']].to_json(orient='records')) 

# df.year = pd.Categorical(df.year) 
# df.groupby(['Village','year'])['rank'].mean().head(10).reset_index().to_json(orient='records') 
# # '[{"Village":"Abarwuha","year":1983,"rank":null},{"Village":"Abarwuha","year":1984,"rank":1.0},{"Village":"Abarwuha","year":1985,"rank":null},{"Village":"Abarwuha","year":1986,"rank":5.0},{"Village":"Abarwuha","year":1987,"rank":null},{"Village":"Abarwuha","year":1988,"rank":null},{"Village":"Abarwuha","year":1989,"rank":null},{"Village":"Abarwuha","year":1990,"rank":null},{"Village":"Abarwuha","year":1991,"rank":null},{"Village":"Abarwuha","year":1992,"rank":null}]'  


# df[['Region','District']].groupby(['Region']).agg(['unique']).to_json(orient='index')    
# # '{"Amhara":{"(\'District\', \'unique\')":["Libo Kemkem","Ibinat","Enesie Sar Midir","Shebel Berenta","Goncha Siso Enesie"]},"Tigray":{"(\'District\', \'unique\')":["Tanqua-Abergele","Naeder-Adet","Adwa","Saharti Samre","Medebay-Zana","Emba-Alaje","Ahferom","Raya Azebo","Endamekoni","Kilte Awlaelo","Saharti-Samre","Alamata","Ofla","Kolatemben","Hawzien","Hintalo Wajerat","Ganta-afeshum","Werieleke"]}}'

# df[['Region','District','Village']].groupby(['Region','District']).agg(['unique']).to_json(orient='index')  

# dg.loc[('Amhara', 'Enesie Sar Midir')]
class HierachyData():
    # filename is the file to be read 
    # hiearchy is a list of hiearchy attributes in descending order
    def __init__(self, filename, hiearchy):
        self.data = pd.read_csv(filename)
        self.summary = self.data[hiearchy[0:2]].groupby(hiearchy[0]).agg(['unique']).to_json(orient='index')
        self.data = self.data.set_index(hiearchy)
        self.hiearchy = hiearchy
    def get_summary(self):

        return self.summary

    # get data given hierchy_values
    def get_data(self,hierchy_values):
        return self.data.loc[tuple(hierchy_values)].reset_index().to_json(orient='records')  

    # get data given hierchy_values
    # list of two categorical attributes
    # one numerical attribute
    # and aggragation method
    def get_heatmap_data(self,hierchy_values,categorical,numerical,aggragation):
        # return self.data.loc[tuple(hierchy_values)][categorical+numerical]\
        #              .groupby(categorical)[numerical].agg(aggragation).reset_index().to_json(orient='records')   
        return self.data.loc[tuple(hierchy_values)].groupby(categorical).agg(aggragation).reset_index().to_json(orient='records')   

         
    # categorize an attribute
    # e.g., categorize year so that return NA for all missing years
    def categorize_attribute(self, att):
        self.data[att] = pd.Categorical(self.data[att]) 

# d = HierachyData("./db/heatmap_data_lineage.csv",['Region','District','Village'])
# d.categorize_attribute('year')
# print(d.get_heatmap_data(['Tigray','Medebay-Zana','Adibearj'],['_index','year'],['rank'],'mean'))
# print(d.get_summary())



# d = HierachyData("./db/intitiate_cleaned2.csv",['Region','District','Village','_index'])
# df = pd.read_csv("./db/intitiate_cleaned2.csv")
# print(d.get_data(['Tigray','Medebay-Zana','Adibearj',70]))
