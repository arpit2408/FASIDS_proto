Fire Ant Spatial Information and Decision Support
===

## Synopsis

This readme.md is about Ant Spatial Information and Decision Support (FASIDS). This web project is funded by Texas A&M AgriLife Extension, and is supervised by Prof. Robert Coulson at Department of Entomology. Bowei Liu has been responsible for the implementation of this version of FASIDS since October 2016. This web project aims at facilitating management of imported fire ants. It has mainly three purposes: 
  1. Landscape tool in fire ant management 
  2. Fire ant management knowledge base 
  3. Fire ant management Knowledge sharing

At the time of writing (04/14/2016), This project adopts [MEAN stack](http://blog.mongodb.org/post/49262866911/the-mean-stack-mongodb-expressjs-angularjs-and), and can be hosted in Linux server or in Windows server having IIS with [IISNODE](https://github.com/tjanczuk/iisnode).

The project can be visited at http://fasids.tamu.edu OR http://fasids.tamu.edu/node/fasids.

The edge version of project is currently hosted at [OpenShift Redhat cloud](http://fasids-u7yhjm.rhcloud.com/) for testing purpose. 

## Features and Usage

Mark to be treated area on map, put land usuage, memo, and fire ant mound denstiy to it, and save it to your profile. 
![save treatment area][polygon]

##### Start Drawing
Click the uppoermost button on left tool panel. Click on map to place a vertex. To finish drawing, just click on the first vertex of polyline. Then one polygon will apear on map.
To remove in one **closed** polygon, just click the "Remove Area" button in left panel, and left click inside the polygon. You can place remove multiple parts from one polygon. 

##### Edit Shape and restore removed area
Click "Edit Shape" in left panel to enter edit mode. Then right click on one vertex, one small menu will pop up, select function you want from "remove vertex" or "remove subroute". 

##### Set Treatment
Click the "Set Treatment" button in tool panel at left side. One modal will pop out. Enter properties and save changes to server.

##### Product List.
After you have set treatment, and saved treatment to server. Product List button will appear in tool panel at left side. Click it, then you will see product suitable for your treatment.
![product list][productList]

##### Retrieve the polygon and edit again
Log into your account, enter user dashboard. Your polygon will be listed there.
You can click the "edit" enter edit mode of this polygon again.

## Tests

Describe and show how to run the tests with code examples.

## Contributors

[Bowei Liu][1], Computer Engineering Major, Master of Engineering candidate, Texas A&M Unviersity. **Actively seeking one full-time position in software development beginning at August 2016**.

Sylvia Wang, Management Information System, Master of Science candidate, Texas A&M Universtity.

Maria D. Tchakerian, Associate Research Scientist, Dept. of Entomology, Texas A&M University 

## License  
The MIT License

Copyright (c) 2015-2016 Knowledge Engineering Lab, Dept. of Entomology, Texas A&M University


[1]: https://www.linkedin.com/in/boweiliujs
[polygon]: /public/img/procedures/07aftersettingtreatment.jpg
[productList]: /public/img/procedures/08productresult2.jpg