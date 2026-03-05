const { Router } = require("express");
const { authenticate } = require("../../middlewares/auth.middleware");
const doctorsController = require("./doctors.controller");

const doctorsRouter = Router();

doctorsRouter.get("/", doctorsController.listDoctors);

doctorsRouter.get("/:doctorId", authenticate, doctorsController.getDoctorDetail);

module.exports = { doctorsRouter };
