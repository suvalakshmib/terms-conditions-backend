
import express from "express";
import UserController from "../../controllers/user.controller";
import TermsController from "../../controllers/terms.controller";
import * as Validation from "../../helpers/validation.helper";
import expressValidator from "express-joi-validation";
const validator = expressValidator.createValidator({});
const router = express.Router();

router.post("/create_terms", validator.body(Validation.createTerms), UserController.verifyToken, TermsController.createTerms);

router.post("/get_terms", UserController.verifyToken, TermsController.getTerms);

router.post("/get_many_terms", UserController.verifyToken, TermsController.getManyTerms);

router.post("/edit_terms", validator.body(Validation.editTerms), UserController.verifyToken, TermsController.editTerms);

router.post("/delete_terms", validator.body(Validation.deleteTerms), UserController.verifyToken, TermsController.deleteTerms);

router.post("/get_summary", UserController.verifyToken,TermsController.getSummaryAndProblems)

router.post("/get_summary_from_pdf", UserController.verifyToken, TermsController.getSummaryFromPdf)

export default router;
