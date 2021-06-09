const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const EventSchema = Schema(
    {
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            required: true,
        },
        registration_starts: {
            type: Date,
            required: true,
        },
        registration_ends: {
            type: Date,
            required: true,
        },
        event_starts: {
            type: Date,
            required: true,
        },
        event_ends: {
            type: Date,
            required: true,
        },
        organizers: [Object],
    },
    { timestamps: true }
);

module.exports = mongoose.model("Event", EventSchema);