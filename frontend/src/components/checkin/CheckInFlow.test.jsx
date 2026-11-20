import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import * as checkinApi from "../../api/checkin";
import Help from "../../pages/Help";
import { renderApp } from "../../test/helpers";
import CheckInFlow from "./CheckInFlow";

vi.mock("../../api/checkin");

// Three questions: a required mood question, a required sleep question, an optional text question
const questions = [
  { id: 1, text: "How is your mood today?", answer_type: "option", metric: "mood", is_required: true, max_length: null, display_order: 1,
    options: [{ label: "Low", value: 2 }, { label: "Okay", value: 3 }, { label: "Good", value: 4 }] },
  { id: 2, text: "How many hours did you sleep?", answer_type: "option", metric: "sleep", is_required: true, max_length: null, display_order: 2,
    options: [{ label: "4-5", value: 4.5 }, { label: "7-8", value: 7.5 }] },
  { id: 3, text: "What is on your mind today?", answer_type: "text", metric: "none", is_required: false, max_length: 300, display_order: 3, options: null },
];

const routes = [
  ["/app/checkin", <CheckInFlow key="flow" questions={questions} todayEntry={null} />],
  ["/app/help", <Help key="help" />],
];

describe("Check-in flow", () => {
  it("shows one question at a time and moves forward by tapping an answer", async () => {
    renderApp(routes, "/app/checkin");
    const typing = userEvent.setup();

    expect(screen.getByText("Question 1 of 3")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "How is your mood today?" })).toBeInTheDocument();
    expect(screen.queryByText("How many hours did you sleep?")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Next/ })).toBeDisabled(); // required: no answer yet

    await typing.click(screen.getByRole("radio", { name: "Good" }));
    // after a short pause the next question appears by itself
    expect(await screen.findByText("Question 2 of 3")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "How many hours did you sleep?" })).toBeInTheDocument();
  });

  it("Back returns to the previous question with the answer still chosen", async () => {
    renderApp(routes, "/app/checkin");
    const typing = userEvent.setup();
    await typing.click(screen.getByRole("radio", { name: "Okay" }));
    await screen.findByText("Question 2 of 3");

    await typing.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByText("Question 1 of 3")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Okay" })).toBeChecked();
  });

  it("keyboard: Space chooses (and does not rush on), Enter moves to the next question", async () => {
    renderApp(routes, "/app/checkin");
    const typing = userEvent.setup();
    const first = screen.getByRole("radio", { name: "Low" }); // focus starts on the first option
    await waitFor(() => expect(first).toHaveFocus());

    await typing.keyboard(" ");
    expect(first).toBeChecked();
    expect(screen.getByText("Question 1 of 3")).toBeInTheDocument(); // still here: choosing by keyboard doesn't auto-advance

    await typing.keyboard("{Enter}");
    expect(await screen.findByText("Question 2 of 3")).toBeInTheDocument();
  });

  it("reaches the review screen, lets you skip the optional question, and sends the right answers", async () => {
    checkinApi.submit.mockResolvedValue({ entry_id: 1, entry_date: "2026-11-20", mood: 4, stress: null, sleep_hours: 7.5, crisis: false, crisis_response: null });
    renderApp(routes, "/app/checkin");
    const typing = userEvent.setup();

    await typing.click(screen.getByRole("radio", { name: "Good" }));
    await screen.findByText("Question 2 of 3");
    await typing.click(screen.getByRole("radio", { name: "7-8" }));
    await screen.findByText("Question 3 of 3");
    await typing.click(screen.getByRole("button", { name: "Skip" }));

    expect(await screen.findByText("Take a quick look")).toBeInTheDocument();
    expect(screen.getByText("Good")).toBeInTheDocument();
    expect(screen.getByText("7-8")).toBeInTheDocument();
    expect(screen.getByText("Skipped")).toBeInTheDocument();

    await typing.click(screen.getByRole("button", { name: "Send my check-in" }));
    await waitFor(() =>
      expect(checkinApi.submit).toHaveBeenCalledWith([
        { question_id: 1, option_value: 4 },
        { question_id: 2, option_value: 7.5 },
      ]),
    );
    expect(await screen.findByText("Thanks for checking in")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/app/checkin"); // normal result: no redirect
  });

  it("when the server says crisis: true, goes straight to the crisis screen with the helpline info", async () => {
    checkinApi.submit.mockResolvedValue({
      entry_id: 2, entry_date: "2026-11-20", mood: 2, stress: null, sleep_hours: 4.5, crisis: true,
      crisis_response: {
        message: "Thank you for sharing this with us.",
        helplines: [{ name: "Tele-MANAS", contact: "14416 or 1-800-891-4416" }, { name: "Emergency", contact: "112" }],
        campus_counsellor: "Campus Counselling Centre, +91 98765 43210",
        show_urgent_booking: true,
      },
    });
    renderApp(routes, "/app/checkin");
    const typing = userEvent.setup();

    await typing.click(screen.getByRole("radio", { name: "Low" }));
    await screen.findByText("Question 2 of 3");
    await typing.click(screen.getByRole("radio", { name: "4-5" }));
    await screen.findByText("Question 3 of 3");
    await typing.type(screen.getByLabelText("What is on your mind today?"), "I want to end my life");
    await typing.click(screen.getByRole("button", { name: "Review" }));
    await typing.click(await screen.findByRole("button", { name: "Send my check-in" }));

    // redirected to the crisis screen (not the "Thanks for checking in" screen)
    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("/app/help"));
    expect(screen.queryByText("Thanks for checking in")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "You don't have to go through this alone." })).toBeInTheDocument();
    expect(screen.getByText("Thank you for sharing this with us.")).toBeInTheDocument(); // the backend's message
    // tap-to-call links: fixed numbers + the campus counsellor's number from the backend
    expect(screen.getByRole("link", { name: /Call Tele-MANAS 14416/ })).toHaveAttribute("href", "tel:14416");
    expect(screen.getByRole("link", { name: /Call Emergency 112/ })).toHaveAttribute("href", "tel:112");
    expect(screen.getByRole("link", { name: /Call Campus counsellor/ })).toHaveAttribute("href", "tel:+919876543210");
  });

  it("shows the server's error and keeps the answers when sending fails", async () => {
    checkinApi.submit.mockRejectedValue(new Error("Can't reach the server. Please check your connection and try again."));
    renderApp(routes, "/app/checkin");
    const typing = userEvent.setup();
    await typing.click(screen.getByRole("radio", { name: "Good" }));
    await screen.findByText("Question 2 of 3");
    await typing.click(screen.getByRole("radio", { name: "7-8" }));
    await screen.findByText("Question 3 of 3");
    await typing.click(screen.getByRole("button", { name: "Skip" }));
    await typing.click(await screen.findByRole("button", { name: "Send my check-in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Can't reach the server");
    expect(screen.getByText("Take a quick look")).toBeInTheDocument(); // still on review, nothing lost
    expect(screen.getByRole("button", { name: "Send my check-in" })).toBeEnabled();
  });

  it("never writes answers to the browser's storage", async () => {
    renderApp(routes, "/app/checkin");
    const typing = userEvent.setup();
    await typing.click(screen.getByRole("radio", { name: "Good" }));
    await screen.findByText("Question 2 of 3");
    expect(JSON.stringify({ ...localStorage })).toBe("{}");
    expect(JSON.stringify({ ...sessionStorage })).toBe("{}"); // not even the token: nobody is logged in
  });
});
