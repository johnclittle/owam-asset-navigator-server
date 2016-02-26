var express = require('express');
var app = express();
var oracledb = require('oracledb');
var dbConfig = require('./dbconfig.js');
var portid = 3000;    // HTTP listening port number
var dbPoolSettings = {
	user			: dbConfig.user,
	password		: dbConfig.password,
	connectString	: dbConfig.connectString,
	poolMax			: 4, // maximum size of the pool
	poolMin			: 0, // let the pool shrink completely
	poolIncrement	: 1, // only grow the pool by one connection at a time
	poolTimeout		: 0  // never terminate idle connections
}
var assets_sql = "SELECT assets.*, "
	assets_sql += "(SELECT COUNT(PARENT_ASSET_ID) AS total_columns FROM SYNERGEN.SA_ASSET childassets WHERE childassets.PARENT_ASSET_ID = assets.ASSET_ID) CHILD_COUNT, "
	assets_sql += "(SELECT COUNT(ASSET_ID) AS total_columns FROM SYNERGEN.SA_WORK_REQUEST workrequesthistory WHERE workrequesthistory.ASSET_ID = assets.ASSET_ID ) OPEN_WR_COUNT, "
	assets_sql += "(SELECT COUNT(ASSET_ID) AS total_columns FROM SYNERGEN.SA_WORK_ORDER workhistory WHERE workhistory.ASSET_ID = assets.ASSET_ID ) OPEN_WO_COUNT "
	assets_sql += "FROM SYNERGEN.SA_ASSET assets "

oracledb.createPool (dbPoolSettings, function (err, pool) {
	if (err) { console.error("createPool() callback: " + err.message);return; }

 	app.listen(portid, function () { console.log('App listening on port: ' + portid); });

	app.use(function(req, res, next) {
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
		next();
	});

 	
 	app.get('/', function (req, response) {
 		response.redirect('/assets');
	});


 	// INDEX ROUTE
	app.get('/assets', function (req, response) {
		sql = assets_sql + "WHERE PARENT_ASSET_ID IS NULL";
		var mnr = req.query.maxnumrows || 1000;
		var ot = req.query.offset || 0;
		doQuery(pool, sql, {maxnumrows: mnr, offset: ot}, function(records){
			response.json(records);
		});

	});

	// SHOW ASSET ROUTE
	app.get('/assets/:asset_id', function (req, response) {
		sql = assets_sql + "WHERE ASSET_ID = :id"
		var records = doQuery(pool, sql, {id: req.params.asset_id}, function(records){
			records.length ? response.json(records[0]) : response.json({})
		});
	});

	// SHOW ASSET ROUTE
	app.get('/assets/:asset_id/children', function (req, response) {
		sql = assets_sql + "WHERE PARENT_ASSET_ID = :id"
		var mnr = req.query.maxnumrows || 25;
		var ot = req.query.offset || 0;
		var records = doQuery(pool, sql, {id: req.params.asset_id, maxnumrows: mnr, offset: ot}, function(records){
			response.json(records);
		});
	});

	// ASSET COSTS ROUTE
	app.get('/assets/:asset_id/cost', function (req, response) {
		var sql = "SELECT PERIOD_YEAR, SUM(DIRECT_ACTUAL_AMOUNT) as DIRECT_COST, SUM(CHILD_ACTUAL_AMOUNT) as CHILD_COST "
			sql += "FROM SYNERGEN.SA_ASSET_COST WHERE ASSET_ID = :id GROUP BY PERIOD_YEAR"
		var records = doQuery(pool, sql, {id: req.params.asset_id}, function(records){
			response.json(records);
		});
	});

});


function doQuery(pool, sql, params, callback){
	 pool.getConnection (function(err, connection){
		if (err) { handleError( "getConnection() failed ", err); return; }
		if ("offset" in params){
			if (connection.oracleServerVersion >= 1201000000) {
				// 12c row-limiting syntax
				sql += "OFFSET :offset ROWS FETCH NEXT :maxnumrows ROWS ONLY";
			} else {
				// Pre-12c syntax [could also customize the original query and use row_number()]
				sql = "SELECT * FROM (SELECT A.*, ROWNUM AS ROW_NUM FROM "
				+ "(" + sql + ") A "
				+ "WHERE ROWNUM <= :maxnumrows + :offset) WHERE ROW_NUM > :offset ";
			}
		}
		// console.log(sql);
		connection.execute(sql, params, {maxRows: 1000}, function(err, result){
			if (err) {
				handleError( "execute() callback", err);
				connection.release( function(err){
					if (err) { handleError( "release() callback", err); return; }
				});
				return;
			}
			var records = []
			for(r=0; r<result.rows.length; r++){
				var record = {}
				for(f=0; f<result.metaData.length; f++){
					record[result.metaData[f].name] = result.rows[r][f]
				}
				records.push(record);
			}
			connection.release( function(err){
				if (err) { handleError( "release() callback", err); return; }
			});
			callback(records);
		});
	});
}

// Report an error
function handleError(text, err) {
	if (err) { 
		text += " " + err.message;
		console.error(text);
	}
}
