var mysql = require('mysql');
const env = require('../env.js');
const config = require('../dbconfig.js')[env];

async function getMovieList() {

    var Query;
    var pool  = mysql.createPool(config);
    
    return new Promise((resolve, reject) => {

       //Query = `SELECT * FROM movies WHERE warehouse_status = 1 ORDER BY CONVERT( warehouse_name USING tis620 ) ASC `;
         Query = `SELECT * FROM moviedb`;
 
         pool.query(Query, function (error, results, fields) {
            if (error) throw error;

            if (results.length > 0) {
                pool.end();
                return resolve(results);   
            } else {
                pool.end();
                return resolve({
                    statusCode: 404,
                    returnCode: 11,
                    message: 'No movie found',
                });
            }

        });

    });
    

}


module.exports.MovieRepo = {
    getMovieList: getMovieList,
    
};
