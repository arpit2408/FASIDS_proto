Fire Ant Spatial Information and Decision Support
===

## Synopsis

This readme is about **Fire Ant Spatial Information and Decision Support (FASIDS)**. This Software as a Service project is funded by [Texas A&M AgriLife Extension](http://agrilifeextension.tamu.edu/), and is supervised by Prof. [Robert Coulson](http://entomology.tamu.edu/people/coulson-robert/) at Department of Entomology. [Bowei Liu](https://www.linkedin.com/in/boweiliujs) is responsible for the implementation of this version of FASIDS.
This SaaS project aims at fascilitating management of imported fire ant.  It has mainly three purposes:
1. Landscape tool in fire ant management
2. Fire ant management knowledge base 
3. Fire ant management Knowledge sharing 

This project adopts [MEAN stack](http://blog.mongodb.org/post/49262866911/the-mean-stack-mongodb-expressjs-angularjs-and), and can be hosted in Linux server or in Windows server having IIS and [IISNODE](https://github.com/tjanczuk/iisnode). 

The project is currently hosted at [OpenShift Redhat cloud](http://fasids-u7yhjm.rhcloud.com/) for testing purpose. The IIS hosted site is only internally accessible from TAMU. 

## Features and Usage

Mark to be treated area on map, put land usuage, memo, and fire ant mound denstiy to it, and save it to your profile. 
![save treatment area](http://fasids-u7yhjm.rhcloud.com/img/screenshots/draw_area.jpg)

##### Start Drawing
Click the uppoermost button on left tool panel. Click on map to place a vertex. To finish drawing, just click on the first vertex of polyline. Then one polygon will apear on map.
To place one hold in one **closed** polygon, just click the "DRAW HOLE" button in left panel, and left click inside the polygon in which you would like to place one hole. You can place multiple holes inside one polygon. 

##### Edit Shape and Remove Holes
Right click on one vertex, one small menu will pop up, select function you want. 

##### Set Properties
Click the "SET PROPERTIES" button on left tool panel, then click on the polygon you want to set property. One modal will pop out. Enter properties and save changes.

##### Save polygon and see result.
Click "SAVE & SEE RESULT" button. Similarly, you need to again click on the polygon you want to save. Browser will take you to result page for the saved polygon. Some fire ant products will be listed below the map, showing the amount of usage.

##### Retrieve the polygon and edit again
Log into your account, enter user dashboard. Your polygon will be listed there.
You can click the "edit" enter edit mode of this polygon again.

## Tests

Describe and show how to run the tests with code examples.

## Contributors

Bowei Liu, Computer Engineering Major, Master of Engineering candidate, Texas A&M Unviersity. **Actively seeking one full-time position in software development beginning at August 2016**.

Maria D. Tchakerian, Associate Research Scientist, Dept. of Entomology, Texas A&M University 

## License


The MIT License

Copyright (c) 2015-2016 Knowledge Engineering Lab, Dept. of Entomology, Texas A&M University