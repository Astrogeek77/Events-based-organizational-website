const Contact = require("../models/contact"); // Contact schema
const Newsletter = require("../models/newsletter"); // Newsletter schema
const ErrorHandler = require("../utils/errorHandler"); // Error handler class
const Magazine = require("../models/magazine-reciever");  // For getting magazine schema
const nodeMailer = require("nodemailer");
const { google } = require("googleapis");

const homeCont = {
    // Index controller render the home page from layout section in views folder
    index: (req, res) => {
        res.render("layouts/home-new"); // res means response and render is another function applied on this res object which renders the html page
    },

    // Contact controller is an async function which saves contact data onto the DB which requires the functionality of await keyword
    contact: async (req, res, next) => {
        try {
            // console.log(req.body);
            const { name, email, message } = req.body; // Destructuring data out of contact object

            // Nodemailer Transport
            const transporter = nodeMailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.EMAIL_ID,
                    pass: process.env.EMAIL_PASSWORD,
                },
            });

            const mailOptions = {
                from: process.env.EMAIL_ID,
                to: "konarklohat123456@gmail.com",
                subject: `Message from ${name}`,
                text: `${message} from ${email}`,
                html: `<h1>${name}</h1> <br><p>${message} <br>from ${email}</p>`,
            };

            transporter.sendMail(mailOptions, (error, data) => {
                if (error) {
                    console.log(error);
                    next(ErrorHandler.serverError());
                } else {
                    return res.status(200).json({
                        message:
                            "Message sent successfully! We will get back to you ASAP",
                    });
                }
            });
        } catch (err) {
            next(ErrorHandler.serverError()); // If try block encounters any error then error handler will come to play to make it look like generic server error
        }
    },

    newsletter: async (req, res) => {
        try {
            const { email } = req.body;
            await Newsletter.findOne({ email }, async (err, existingEmail) => {
                if (err) {
                    next(ErrorHandler.serverError());
                } else if (existingEmail) {
                    return res.status(200).json({
                        message: "Entered E-Mail is already subscribed",
                    });
                } else {
                    const newNewsletter = new Newsletter({
                        email,
                    });
                    await newNewsletter.save();
                    return res.status(200).json({
                        message: "Successfully Subscribed",
                    });
                }
            });
        } catch (err) {
            console.log(err);
            next(ErrorHandler.serverError());
        }
    },

    registerMagazineEmail: async (req, res, next) => {
        await Magazine.findOne({ email: req.body.email }, async (err, foundReciever) => {
            if(err){
                console.log(err);
                next(ErrorHandler.serverError());
            }else if(!foundReciever){
                const newReciever = new Magazine({
                    email: req.body.email
                })
                
                let client_side = new google.auth.JWT(
                    process.env.client_email,
                    null,
                    process.env.private_key,
                    [
                        "https://www.googleapis.com/auth/spreadsheets"
                    ]
                );

                let count = await Magazine.find().estimatedDocumentCount();
                newReciever.sheet_position = count+2;
                
                client_side.authorize((err,token) => {
                    if(err){
                        console.log(err);
                        return;
                    }else{
                        sheeteditor(client_side);
                    }
                });

                sheeteditor = async (client) => {
                    const sheetAPI = google.sheets(
                        {
                            version: "v4",
                            auth: client
                        }
                    );
                    let sources = [
                        [
                            newReciever.email,
                            true
                        ]
                    ]
                    const options1 = {
                        spreadsheetId: process.env.magazineRecievers_spreadsheet_id,
                        range: `${process.env.magazineRecieverSheet}!A2`,
                        valueInputOption: "RAW",
                        resource: {
                            values: sources
                        }
                    }
                    await sheetAPI.spreadsheets.values.append(options1);
                }

                await newReciever.save();
                return res.json({
                    message: "Email registered successfully for the monthly magazine"
                })
            }else{

                // sheet API code
                let client_side = new google.auth.JWT(
                    process.env.client_email,
                    null,
                    process.env.private_key,
                    [
                        "https://www.googleapis.com/auth/spreadsheets"
                    ]
                );
                
                client_side.authorize((err,token) => {
                    if(err){
                        console.log(err);
                        return;
                    }else{
                        sheeteditor(client_side);
                    }
                });

                sheeteditor = async (client) => {
                    const sheetAPI = google.sheets(
                        {
                            version: "v4",
                            auth: client
                        }
                    );
                    let sources = [
                        [
                            foundReciever.email,
                            true
                        ]
                    ]
                    const options1 = {
                        spreadsheetId: process.env.magazineRecievers_spreadsheet_id,
                        range: `${process.env.magazineRecieverSheet}!A${foundReciever.sheet_position}`,
                        valueInputOption: "RAW",
                        resource: {
                            values: sources
                        }
                    }
                    await sheetAPI.spreadsheets.values.update(options1);
                }

                foundReciever.subscribed = true;
                await foundReciever.save();
                return res.json({
                    message: "You have successfully subscribed to our Monthly Magazine"
                })
            }
        })
    },

    unSubMagazineEmail: async (req, res, next) => {
        await Magazine.findOne({ _id: req.params.id }, async (err, foundReciever) => {
            if(err){
                console.log(err);
                next(ErrorHandler.serverError());
            }else if(!foundReciever){
                return res.json({
                    message: "Not Valid"
                })
            }else{
                // sheets API code
                let client_side = new google.auth.JWT(
                    process.env.client_email,
                    null,
                    process.env.private_key,
                    [
                        "https://www.googleapis.com/auth/spreadsheets"
                    ]
                );
                
                client_side.authorize((err,token) => {
                    if(err){
                        console.log(err);
                        return;
                    }else{
                        sheeteditor(client_side);
                    }
                });

                sheeteditor = async (client) => {
                    const sheetAPI = google.sheets(
                        {
                            version: "v4",
                            auth: client
                        }
                    );
                    let sources = [
                        [
                            foundReciever.email,
                            false
                        ]
                    ]
                    const options1 = {
                        spreadsheetId: process.env.magazineRecievers_spreadsheet_id,
                        range: `${process.env.magazineRecieverSheet}!A${foundReciever.sheet_position}`,
                        valueInputOption: "RAW",
                        resource: {
                            values: sources
                        }
                    }
                    await sheetAPI.spreadsheets.values.update(options1);
                }
                foundReciever.subscribed = false;
                await foundReciever.save();
                return res.json({
                    message: "You have successfully unsubscribed"
                })
            }
        })
    },
};

// Exporting homeCont object. To make it accessible to other files by requiring or importing it.
module.exports = homeCont;
