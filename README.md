# owam-asset-navigator-server

## <a name="about"></a> About owam-asset-navigator-server

An example using [the node-oracledb](https://github.com/oracle/node-oracledb) to create web server that produces json endpoints capable of supporting a front end client that is similar to the asset navigator user interface found in the  [ Oracle WAM 1.9.x system](http://www.oracle.com/us/products/applications/utilities/business-solutions/work-asset-management/overview/index.html).

This example was presented at the [FULLCIRCLE 2016 WAM USERS GROUP](http://ouug.org/wam/).

## <a name="installation"></a> Installation

Prerequisites:

- [Node and NPM](https://docs.npmjs.com/getting-started/installing-node)  
- [Oracle WAM 1.9.x system](http://www.oracle.com/us/products/applications/utilities/business-solutions/work-asset-management/overview/index.html)  
- [Node-oracledb](https://github.com/oracle/node-oracledb) and follow all appropriate setup for [Node-oracledb](https://github.com/oracle/node-oracledb)  

## <a name="quickstart"></a> Quick Start

1. [Download](https://github.com/johnclittle/owam-asset-navigator-server/archive/master.zip) or clone the project 
  * to clone the project you will need to install [git](https://git-scm.com/)
2. Navigate into the project directory and  run `npm install`
3. Copy dbconfig-example.js to dbconfig.js and insert database connection information
4. Start the server by issuing `node index.js` from the command line
5. Navigate to localhost:3000\assets

## <a name="endpoints"></a> Endpoints

### /assets

This endpoint returns all top level assets. Top level assets are assets without a parent.

Paging options:
- Offset - sets the number of records to offset
  - example: /assets?offset=1 
- Maxnumrows - sets the number of records to offset
  -example: /assets?maxnumrows=1 

### /assets/:asset_id

This endpoint returns the information about the particular asset as identified by the assset id.

### /assets/:asset_id/children

This endpoint returns all the child assets about the particular asset as identified by the assset id.

Paging options:
- Offset - sets the number of records to offset
  - example: /assets?offset=1 
- Maxnumrows - sets the number of records to offset
  -example: /assets?maxnumrows=1 

### /assets/:asset_id/cost

This endpoint returns the cost by period information about the particular asset as identified by the assset id.