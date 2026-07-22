export const validate = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return res.status(422).json({
        success: false,
        message: "Validasi gagal",
        errors,
      });
    }

    req.validated = result.data;
    next();
  };
};
