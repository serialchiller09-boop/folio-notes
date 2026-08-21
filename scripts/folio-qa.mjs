import { chromium } from "playwright";

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on("console", (msg) => {
  if (msg.type() === "error") console.log("CONSOLE ERROR", msg.text());
});
page.on("pageerror", (err) => console.log("PAGEERROR", err.message));

await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
await page.getByRole("heading", { name: "Welcome to Folio", exact: true }).waitFor({ timeout: 20000 });
await page.screenshot({ path: "/workspace/screenshots/home-loaded.png" });

await page.getByRole("heading", { name: "Welcome to Folio", exact: true }).click();
await page.getByRole("button", { name: /Listen|Pause|Resume/ }).waitFor({ timeout: 10000 });
await page.waitForTimeout(600);
await page.screenshot({ path: "/workspace/screenshots/editor-welcome.png", fullPage: true });

const video = page.locator("video");
console.log("video count", await video.count());
await video.first().scrollIntoViewIfNeeded();
await page.waitForTimeout(400);
await page.screenshot({ path: "/workspace/screenshots/editor-video.png" });

await page.getByRole("link", { name: "Back to notes" }).click();
await page.getByRole("heading", { name: "Folio", exact: true }).waitFor();
await page.getByRole("button", { name: "New note" }).first().click();
await page.getByRole("textbox", { name: "Note title" }).fill("Field notes");
await page.locator("[contenteditable]").first().click();
await page.keyboard.type("Pumps were noisy on the west pad.");
await page.waitForTimeout(800);
await page.screenshot({ path: "/workspace/screenshots/editor-new.png" });
await page.getByRole("link", { name: "Back to notes" }).click();
await page.getByRole("heading", { name: "Field notes", exact: true }).waitFor({ timeout: 8000 });
await page.screenshot({ path: "/workspace/screenshots/home-after-create.png" });

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
await mobile.getByRole("heading", { name: "Welcome to Folio", exact: true }).waitFor({ timeout: 20000 });
await mobile.screenshot({ path: "/workspace/screenshots/home-mobile-loaded.png" });
await mobile.getByRole("heading", { name: "Welcome to Folio", exact: true }).click();
await mobile.waitForTimeout(700);
await mobile.screenshot({ path: "/workspace/screenshots/editor-mobile.png", fullPage: true });
const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
console.log("mobile overflow", overflow);
console.log("OK");
await browser.close();
