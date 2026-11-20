import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import * as authApi from "../../api/auth";
import { renderApp } from "../../test/helpers";
import Login from "./Login";

vi.mock("../../api/auth"); // no real network: we decide what the "server" answers

const routes = [
  ["/login", <Login key="login" />],
  ["/app", <p key="a">student home</p>],
  ["/counsellor", <p key="c">counsellor home</p>],
  ["/admin", <p key="d">admin home</p>],
];

const user = (role) => ({ id: 1, email: "x@college.edu", full_name: "Test User", role, is_active: true });

async function logIn(email = "asha@college.edu", password = "secret123") {
  const typing = userEvent.setup();
  await typing.type(screen.getByLabelText("Email"), email);
  await typing.type(screen.getByLabelText("Password"), password);
  await typing.click(screen.getByRole("button", { name: "Log in" }));
}

describe("Login form", () => {
  it("has labelled fields and a submit button", () => {
    renderApp(routes, "/login");
    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: "Log in" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create an account" })).toHaveAttribute("href", "/register");
  });

  it("sends the typed email and password to the API", async () => {
    authApi.login.mockResolvedValue({ access_token: "token-123", role: "student" });
    authApi.me.mockResolvedValue(user("student"));
    renderApp(routes, "/login");
    await logIn("asha@college.edu", "secret123");
    await waitFor(() => expect(authApi.login).toHaveBeenCalledWith("asha@college.edu", "secret123"));
  });

  it.each([
    ["student", "/app"],
    ["counsellor", "/counsellor"],
    ["admin", "/admin"],
  ])("sends a %s to their own home (%s)", async (role, home) => {
    authApi.login.mockResolvedValue({ access_token: "t", role });
    authApi.me.mockResolvedValue(user(role));
    renderApp(routes, "/login");
    await logIn();
    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent(home));
    expect(screen.getByText(`${role} home`)).toBeInTheDocument();
  });

  it("shows the server's message and stays on the page when the password is wrong", async () => {
    authApi.login.mockRejectedValue(new Error("Incorrect email or password"));
    renderApp(routes, "/login");
    await logIn("asha@college.edu", "wrong-password");
    // role="alert": announced by screen readers
    expect(await screen.findByRole("alert")).toHaveTextContent("Incorrect email or password");
    expect(screen.getByTestId("location")).toHaveTextContent("/login");
    expect(authApi.me).not.toHaveBeenCalled();
  });

  it("can show and hide the password", async () => {
    renderApp(routes, "/login");
    const typing = userEvent.setup();
    const field = screen.getByLabelText("Password");
    await typing.click(screen.getByRole("button", { name: "Show password" }));
    expect(field).toHaveAttribute("type", "text");
    await typing.click(screen.getByRole("button", { name: "Hide password" }));
    expect(field).toHaveAttribute("type", "password");
  });
});
