import axios from "axios";

export const apiMessage = (err: unknown, fallback: string) =>
  axios.isAxiosError(err)
    ? (err.response?.data?.message ?? fallback)
    : "Something went wrong";