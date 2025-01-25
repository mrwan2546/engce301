var dbconfig = {
    development: {
        server: '100.96.0.8',
        database:'team6_engce301_db',
        user:'team6',
        password:'P@ssw0rd',
        port: 1433,
        options:{
            encript: true,
            setTimeout: 12000,
            enableArithAbort: true,
            trustServerCertificate: true,
            trustedconnection:  true,
            instancename:  '100.96.0.8'  // SQL Server instance name
        }
    },
    production: {
        server: 'localhost', //CE Lab Server
        database:'team6_engce301_db',
        user:'team6',
        password:'P@ssw0rd',
        port: 1433,
        options:{
            encript: true,
            setTimeout: 12000,
            enableArithAbort: true,
            trustServerCertificate: true,
            trustedconnection:  true,
            instancename:  'localhost'  // SQL Server instance name
        }
    },

};

module.exports = dbconfig;
