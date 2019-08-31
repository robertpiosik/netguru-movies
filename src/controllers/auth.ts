import { Request, Response, NextFunction } from "express";
import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { User } from "../models/user";

export const signup = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const { email, password }: { email: string; password: string } = req.body;

	if (!email || !password) {
		return next({
			status: 422,
			name: "MissingAuthData",
			message: "Email or password is missing."
		});
	}

	if (!validator.isEmail(email)) {
		return next({
			status: 422,
			name: "InvalidEmail",
			message: "Provided E-mail address is invalid."
		});
	}

	if (password.length < 8) {
		return next({
			status: 422,
			name: "TooShortPassword",
			message: "Provided password is too short."
		});
	}

	try {
		const user = await User.findOne({ email });
		if (!user) {
			const hashedPassword: string = await bcrypt.hash(password, 10);
			const newUser = new User({
				email,
				password: hashedPassword
			});
			await newUser.save();
			res.status(201).json({
				name: "Success",
				message: "User account registered successfully.",
				data: { id: newUser._id.toString() }
			});
		} else {
			next({
				status: 422,
				name: "AlreadyRegistered",
				message: "This e-mail address is already registered."
			});
		}
	} catch (error) {
		next({ data: error });
	}
};

export const login = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const { email, password } = req.body;

	if (!email || !password) {
		return next({
			status: 422,
			name: "MissingAuthData",
			message: "Email or password is missing."
		});
	}
	try {
		const user = await User.findOne({ email });
		if (user) {
			if (await bcrypt.compare(password, user.password)) {
				const token = await jwt.sign(
					{ id: user._id.toString() },
					process.env.JWT_PRIVATE_KEY,
					{ expiresIn: "2d" }
				);
				const expiresAt = Math.floor(Date.now() / 1000) + 172800;
				res.status(200).json({
					name: "Success",
					message: "User authenticated successfully.",
					data: { token, expiresAt }
				});
			} else {
				next({
					status: 403,
					name: "UserNotAuthenticated",
					message: "Provided password is incorrect."
				});
			}
		} else {
			next({
				status: 404,
				name: "UserNotFound",
				message: "User with this e-mail address was not found."
			});
		}
	} catch (error) {
		next({ data: error });
	}
};
