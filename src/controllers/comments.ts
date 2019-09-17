import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

import Movie from "../models/movie";
import Comment from "../models/comment";
import User from "../models/user";

export const postComments = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const { content, movieId } = req.body;
	const errors = validationResult(req);

	if (!req.isAuth) {
		return next({
			status: 401,
			name: "NotAuthorized",
			message: "Not authorized."
		});
	}

	if (!errors.isEmpty()) {
		return next({
			status: 422,
			name: "ValidationErrors",
			message: "Validation errors occured.",
			data: errors.array()
		});
	}

	try {
		const movie = await Movie.findOne({ _id: movieId });
		if (!movie) {
			return next({
				status: 422,
				name: "MovieNotFound",
				message: "Movie not found."
			});
		}

		const newComment = await new Comment({
			creator: req.userId,
			movieId: movie._id,
			content
		}).save();

		movie.comments.push(newComment._id);
		await movie.save();

		const creator = await User.findById(req.userId);
		if (creator) {
			creator.comments.push(newComment._id);
			await creator.save();
		}

		res.status(201).json({ name: "Success", data: newComment });
	} catch (error) {
		next({ data: error });
	}
};

export const getComments = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const page = req.query.page || 1;
	const perPage = parseInt(req.query.per_page) || 2;
	try {
		const total = await Comment.countDocuments();

		const comments = await Comment.find()
			.skip((page - 1) * perPage)
			.limit(perPage)
			.populate({ path: "creator", select: "email" })
			.populate({ path: "movieId", select: "title" });

		res.status(200).json({ name: "Success", data: { total, comments } });
	} catch (error) {
		next({
			data: error
		});
	}
};
