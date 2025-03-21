const sql = require('mssql');
const sql_config = require('../config/config')

const config = {
    user: sql_config.USER,
    password: sql_config.PASSWORD,
    server: sql_config.SERVER,
    database: sql_config.DATABASE,
    options: {
        encrypt: true,   // For Azure SQL
        trustServerCertificate: true
    }
};

module.exports = function(app){

    app.get("/api/student/select", async (req, res)=> {

        console.log("studentViews accessed!")
        try{
            const pool = await sql.connect(config);
            const result = await pool.request().query('SELECT * FROM Students')
           res.json(result.recordset);

        } catch(err){
            res.status({
                message : err || "Some error occurred while selecting data!"
            })
        }
    });

}