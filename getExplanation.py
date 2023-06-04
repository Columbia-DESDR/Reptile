import pandas as pd
import numpy as np  

RegionData = pd.read_csv("./db/pregion2.csv")
RegionData = RegionData.set_index(["Region","year"])
# RegionData.loc[("Tigray",1983)]

DistrictData = pd.read_csv("./db/pvillage3.csv")
DistrictData = DistrictData.set_index(["District","year"])
# VillageData.loc[("Ebenat",1983)]

def getRegionExplanation(region, year, aggOriginal, complained_agg, com_too_small):
    explanations = []
    aggs = ["count","std","mean"]
    

    for index, row in RegionData.loc[(region,year)].iterrows():
        aggOld = {}
        aggNew = {}
        for agg in aggs:
            aggOld[agg] = row[agg]
            aggNew[agg] = row["p" + agg]

        # introuce a mean 0 with count doesn't help
        if(not com_too_small and complained_agg == 'mean' and aggOld['count'] == 0 and (aggNew['count'] < 1 or aggNew['mean'] < 1 )):
            continue
 
        aggAfterRepair = add(remove(aggOriginal,aggOld),aggNew)
        
        if((com_too_small and aggAfterRepair[complained_agg] > aggOriginal[complained_agg] + 0.01) or
         (not com_too_small and aggAfterRepair[complained_agg] < aggOriginal[complained_agg] - 0.01)) :
            
            explanation = {}
            explanation["District"] = row["District"]
            explanation["year"] = year
            explanation["aggNew"] = aggNew
            explanation["after"] = aggAfterRepair[complained_agg]
            explanations.append(explanation)
                
    
    if com_too_small:
        explanations.sort(key=lambda x: -x["after"])
    else:
        explanations.sort(key=lambda x: x["after"])
    
    return explanations[:5]
        

def getDistrictExplanation(district, year, aggOriginal, complained_agg, com_too_small):
    explanations = []
    aggs = ["count","std","mean"]
    

    for index, row in DistrictData.loc[(district,year)].iterrows():
        aggOld = {}
        aggNew = {}
        for agg in aggs:
            aggOld[agg] = row[agg]
            aggNew[agg] = row[agg]

        aggNew['mean'] = row["pmean"]

        
        aggAfterRepair = add(remove(aggOriginal,aggOld),aggNew)
        
        if((com_too_small and aggAfterRepair[complained_agg] > aggOriginal[complained_agg] + 0.01) or
         (not com_too_small and aggAfterRepair[complained_agg] < aggOriginal[complained_agg] - 0.01)) :

            explanation = {}
            explanation["Village"] = row["Village"]
            explanation["year"] = year
            explanation["aggNew"] = aggNew
            explanation["after"] = aggAfterRepair[complained_agg]
            explanations.append(explanation)
                
    
    if com_too_small:
        explanations.sort(key=lambda x: -x["after"])
    else:
        explanations.sort(key=lambda x: x["after"])
    
    return explanations[:5]


def add(agg1, agg2):
    agg3 = {}
    agg3["count"] = agg1["count"] + agg2["count"]
    if(agg3["count"] == 0):
        agg3["mean"] = 0
        agg3["std"] = 0
        return agg3
    agg3["mean"] = (agg1["count"] * agg1["mean"] + agg2["count"] * agg2["mean"])/agg3["count"]

    if(agg3["count"] == 1):
        agg3["std"] = 0
        return agg3

    var = ((agg1["count"] - 1) * (agg1["std"]**2) + (agg2["count"] - 1) * (agg2["std"]**2)
                    + agg1["count"] * ((agg1["mean"] -  agg3["mean"]) **2)
                    + agg2["count"] * ((agg2["mean"] -  agg3["mean"]) **2) )/(agg3["count"] - 1)
    if(var < 0):
        var = 0
    agg3["std"] = var**(0.5)
    return agg3

def remove(agg1, agg2):
    agg3 = {}
    agg3["count"] = agg1["count"] - agg2["count"]
    
    if(agg3["count"] == 0):
        agg3["mean"] = 0
        agg3["std"] = 0
        return agg3
    
    agg3["mean"] = (agg1["count"] * agg1["mean"] - agg2["count"] * agg2["mean"])/agg3["count"]
    
    if(agg3["count"] == 1):
        agg3["std"] = 0
        return agg3
        
    var = ((agg1["count"] - 1) * (agg1["std"]**2) - (agg2["count"] - 1) * (agg2["std"]**2)
                    + agg1["count"] * ((agg1["mean"] -  agg3["mean"]) **2)
                    - agg2["count"] * ((agg2["mean"] -  agg3["mean"]) **2) )/(agg3["count"] - 1)
    if(var < 0):
        var = 0
    agg3["std"] = var**(0.5)
    return agg3