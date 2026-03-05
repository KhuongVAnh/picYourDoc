const { Router } = require("express");
const { authRouter } = require("../modules/auth/auth.routes");
const { doctorsRouter } = require("../modules/doctors/doctors.routes");
const { appointmentsRouter } = require("../modules/appointments/appointments.routes");
const { consultsRouter } = require("../modules/consults/consults.routes");
const { recordsRouter } = require("../modules/records/records.routes");
const {
  subscriptionsRouter,
} = require("../modules/subscriptions/subscriptions.routes");

const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/doctors", doctorsRouter);
apiRouter.use("/appointments", appointmentsRouter);
apiRouter.use("/consults", consultsRouter);
apiRouter.use("/records", recordsRouter);
apiRouter.use("/subscriptions", subscriptionsRouter);

module.exports = { apiRouter };
