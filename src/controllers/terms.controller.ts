
import TermsService from "../services/terms.service";
import _ from "lodash";
import { STATUS, TERMS_RESPONSE, USER_RESPONSE } from "../constants/response.constant";
import { IRequest, IResponse, INextFunction, IQuerySearchTerms } from "../helpers/interface.helper";
import HTTP from "http-status-codes";
import { Configuration, OpenAIApi }  from "openai"

const configuration = new Configuration({
  apiKey: "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",
});

const TermsController = {
  createTerms: async (req: IRequest, res: IResponse, next: INextFunction) => {
    try {
      let getTerms = await TermsService.getTerms({  });
  if(getTerms) return res.status(HTTP.UNPROCESSABLE_ENTITY).send({ status: STATUS.FAILED, message: TERMS_RESPONSE.ALREADY_EXIST });
      const terms = await TermsService.createTerms(req.body);
      if (terms) {
        res.send({
          status: STATUS.SUCCESS,
          message: TERMS_RESPONSE.CREATE_SUCCESS,
          data: terms
        });
      } else {
        res.status(HTTP.UNPROCESSABLE_ENTITY).send({ status: STATUS.SUCCESS, message: TERMS_RESPONSE.CREATE_FAILED });
      }
    } catch (err) {
      err.description = TERMS_RESPONSE.CREATE_FAILED;
      next(err);
    }
  },
  getTerms: async (req: IRequest, res: IResponse, next: INextFunction) => {
    try {
      const terms = await TermsService.getTerms({ _id: req.body.terms_id });
      if (!_.isEmpty(terms)) {
        res.send({ status: STATUS.SUCCESS, message: TERMS_RESPONSE.GET_SUCCESS, data: terms });
      } else {
        res.status(HTTP.UNPROCESSABLE_ENTITY).send({ status: STATUS.FAILED, message: TERMS_RESPONSE.GET_FAILED });
      }
    } catch (err) {
      err.description = TERMS_RESPONSE.GET_FAILED;
      next(err);
    }
  },
  getManyTerms: async (req: IRequest, res: IResponse, next: INextFunction) => {
    try {
      const { skip = 0, limit = 10, search } = req.body;
      let query: IQuerySearchTerms = {};
      if (search && search.length > 0) {
        query = {
          ...query,
          $or: [],
        };
      }
      const termss = await TermsService.getManyTermsWithPagination(query, { skip, limit, sort: { created_at: -1} });
      res.send({
        status: STATUS.SUCCESS,
        message: TERMS_RESPONSE.GET_MANY_SUCCESS,
        data: termss,
      });
    } catch (err) {
      err.description = TERMS_RESPONSE.GET_MANY_FAILED;
      next(err);
    }
  },
  editTerms: async (req: IRequest, res: IResponse, next: INextFunction) => {
    try {
      const { ...body } = req.body;
      const editedTerms = await TermsService.editTerms({ _id: req.body.terms_id }, body);
      if (editedTerms) {
        const query = {
          _id: req.body.terms_id,
        };
        const terms = await TermsService.getTerms(query);
        res.send({
          status: STATUS.SUCCESS,
          message: TERMS_RESPONSE.EDIT_SUCCESS,
          data: terms,
        });
      } else {
        res.status(HTTP.UNPROCESSABLE_ENTITY).send({ status: STATUS.FAILED, message: TERMS_RESPONSE.EDIT_FAILED });
      }
    } catch (err) {
      err.description = TERMS_RESPONSE.EDIT_FAILED;
      next(err);
    }
  },
  deleteTerms: async (req: IRequest, res: IResponse, next: INextFunction) => {
    try {
      const deleteTerms = await TermsService.deleteTerms({ _id: req.body.terms_id });
      if (deleteTerms) {
        res.send({
          status: STATUS.SUCCESS,
          message: TERMS_RESPONSE.DELETE_SUCCESS,
        });
      } else {
        res.status(HTTP.UNPROCESSABLE_ENTITY).send({ status: STATUS.FAILED, message: TERMS_RESPONSE.DELETE_FAILED });
      }
    } catch (err) {
      err.description = TERMS_RESPONSE.DELETE_FAILED;
      next(err);
    }
  },

  getSummaryAndProblems: async (req: IRequest, res: IResponse, next: INextFunction) => {
    try {
      const openai = new OpenAIApi(configuration);
      const summary_prompt = "Please provide a detailed one-line gist for each terms and conditions";
      const problems_prompt = "Generate a list of common problems or challenges that people might face here";
      const summary = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: `${req.body.terms.replace( /[\r\n]+/gm, "" )}\nQ: ${summary_prompt}\nA:` }],
        temperature: 0,
        max_tokens: 500,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
      });

      const problems = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: `${req.body.terms.replace( /[\r\n]+/gm, "" )}\nQ: ${problems_prompt}\nA:`,
          },
        ],
        temperature: 0,
        max_tokens: 500,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
      });


      TermsService.createTerms({
        terms: req.body.terms,
        user: req.decoded.id,
        summary: summary.data.choices[0].message.content,
        summary_prompt: summary_prompt,
        problem: problems.data.choices[0].message.content,
        problem_prompt: problems_prompt,
      });

      res.send({
        status: STATUS.SUCCESS,
        message: USER_RESPONSE.GET_SUMMARY_AND_PROBLEMS,
        data: { summary: summary.data.choices[0].message.content, problems: problems.data.choices[0].message.content },
      });
    } catch (error) {
      res.send({status:STATUS.FAILED,message:"Maximum limit 17000 characters are allowed!.."})
     
    }
  },

  getSummaryFromPdf: async (req: IRequest, res: IResponse, next: INextFunction) => {
    try {
      const textData = await TermsService.getUrl(req);
      const openai = new OpenAIApi(configuration);
      const summary_prompt = "Please provide a detailed one-line gist for each terms and conditions";
      const problems_prompt = "Generate a list of common problems or challenges that people might face while trying to understand or comply here";
      
      const summary = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: `${textData.text.replace( /[\r\n]+/gm, "" )}\nQ: ${summary_prompt}\nA:` }],
        temperature: 0,
        // max_tokens: 64,
        top_p: 1.0,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
      });

      const problems = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: `${textData.text.replace( /[\r\n]+/gm, "" )}\nQ: ${problems_prompt}\nA:`,
          },
        ],
        temperature: 0,
        // max_tokens: 64,
        top_p: 1.0,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
      });

      TermsService.createTerms({
        terms: JSON.stringify(textData.text),
        user: req.decoded.id,
        summary: summary.data.choices[0].message.content,
        summary_prompt: summary_prompt,
        problem: problems.data.choices[0].message.content,
        problem_prompt: problems_prompt,
      });
      res.send({
        status: STATUS.SUCCESS,
        message: USER_RESPONSE.GET_SUMMARY_AND_PROBLEMS,
        data: { summary: summary.data.choices[0].message.content, problems: problems.data.choices[0].message.content },
      });
    } catch (error) {
      console.log("error" + error);
    }
  },
};

export default TermsController;
