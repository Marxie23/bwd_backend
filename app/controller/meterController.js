const Customer = require("../model/customerModel")
const Meter  = require("../model/meterModel");
const MeterReading = require("../model/meterreadingModel")

exports.getAll = async (req, res) => {

    try{
        const meters = await Meter.findAll({
            include:[
                {model: Customer, as : 'Customer'}
            ],
            order: [[{ model: Customer, as: 'Customer' }, 'Lastname', 'ASC']]
        })

        const formattedMeters = meters.map(meter => {
            const customer = meter.Customer;
            return {
                meter_meterID: meter.MeterID,
                meter_meterNo: meter.MeterNumber,
                customer_customerID: customer.CustomerID,
                customer_fullName: `${customer.Firstname} ${customer.Middlename ? `${customer.Middlename}.` : ""} ${customer.Lastname}`,
                customer_accountNumber: customer.AccountNum,
                customer_address: customer.Address,
                status: meter.Status
            }
        })
        
        res.status(200).send({
            status: true,
            meters: formattedMeters
        });
    } catch(error){
        console.error(error)
        res.status(500).send({
            status: false,
            error: error.message,
        });
    }
}