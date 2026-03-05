const { Router } = require("express");

const doctorsRouter = Router();

doctorsRouter.get("/", (req, res) => {
  return res.status(200).json({
    data: [],
    message:
      "Doctor discovery module scaffolded. API detail will be implemented in Phase 2.",
  });
});

doctorsRouter.get("/:doctorId", (req, res) => {
  return res.status(200).json({
    data: { doctorId: req.params.doctorId },
    message:
      "Doctor profile module scaffolded. API detail will be implemented in Phase 2.",
  });
});

module.exports = { doctorsRouter };
