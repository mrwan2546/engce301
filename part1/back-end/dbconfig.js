var dbconfig = {
    development: {
        //connectionLimit : 10,
        host: '127.0.0.1',
        port: '3306',
        user: 'root',
        password: '',
        database: 'moviedb'
    },
    production: {
        //connectionLimit : 10,
        host: 'localost',
        port: '3306',
        user: 'dbuser',
        password: 'P@ssw0rd@2025',
        database: 'moviedb'
    }
};
module.exports = dbconfig;
