package com.paperbank.tests;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.testng.Assert;
import org.testng.annotations.AfterClass;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

import java.lang.reflect.Method;
import java.time.Duration;
import java.util.UUID;

public class PaperBankTest {

    private WebDriver driver;
    private WebDriverWait wait;
    private String baseUrl;

    @BeforeClass
    public void setUpClass() {
        WebDriverManager.chromedriver().setup();
        baseUrl = System.getProperty("app.url", "http://localhost:4000");

        ChromeOptions options = new ChromeOptions();
        options.addArguments("--headless");
        options.addArguments("--disable-gpu");
        options.addArguments("--no-sandbox");
        options.addArguments("--disable-dev-shm-usage");
        options.addArguments("--remote-allow-origins=*");
        options.addArguments("--window-size=1920,1080");

        driver = new ChromeDriver(options);
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
        wait = new WebDriverWait(driver, Duration.ofSeconds(10));
    }

    @BeforeMethod
    public void setUp(Method method) {
        System.out.println("=======================================================");
        System.out.println("▶ STARTING TEST: " + method.getName());
        System.out.println("=======================================================");
    }

    @AfterMethod
    public void tearDown(Method method) {
        System.out.println("✔ FINISHED TEST: " + method.getName() + "\n");
    }

    @Test(priority = 1)
    public void testHomePageTitle() {
        driver.get(baseUrl);
        Assert.assertTrue(driver.getTitle().contains("Paper Bank") || driver.getPageSource().contains("Paper Bank"), "Title should be Paper Bank");
    }

    @Test(priority = 2)
    public void testHeroTextExists() {
        driver.get(baseUrl);
        WebElement heroText = wait.until(ExpectedConditions.visibilityOfElementLocated(By.tagName("h1")));
        Assert.assertTrue(heroText.getText().toUpperCase().contains("FIND PAST PAPERS"), "Hero text should be present");
    }

    @Test(priority = 3)
    public void testSearchInputExists() {
        driver.get(baseUrl);
        WebElement searchInput = driver.findElement(By.id("home-search-input"));
        Assert.assertTrue(searchInput.isDisplayed(), "Search input should be visible");
    }

    @Test(priority = 4)
    public void testFilterDropdownsExist() {
        driver.get(baseUrl);
        Assert.assertTrue(driver.findElement(By.id("filter-type")).isDisplayed(), "Type filter should be visible");
        Assert.assertTrue(driver.findElement(By.id("filter-university")).isDisplayed(), "University filter should be visible");
    }

    @Test(priority = 5)
    public void testRegisterNavigation() {
        driver.get(baseUrl);
        WebElement registerBtn = wait.until(ExpectedConditions.elementToBeClickable(By.xpath("//a[contains(text(), 'Register') or contains(@href, '/register')]")));
        registerBtn.click();
        wait.until(ExpectedConditions.urlContains("/register"));
        Assert.assertTrue(driver.getCurrentUrl().contains("/register"), "Should navigate to register page");
    }

    @Test(priority = 6)
    public void testRegistrationEmptyFields() {
        driver.get(baseUrl + "/register");
        WebElement submitBtn = wait.until(ExpectedConditions.elementToBeClickable(By.id("register-submit")));
        submitBtn.click();
        
        WebElement errorMsg = wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("alert-error")));
        Assert.assertTrue(errorMsg.getText().contains("Name must be at least 2 characters"), "Error message should be shown for empty fields");
    }

    @Test(priority = 7)
    public void testRegistrationPasswordMismatch() {
        driver.get(baseUrl + "/register");
        driver.findElement(By.id("reg-name")).sendKeys("Test User");
        driver.findElement(By.id("reg-email")).sendKeys("test@example.com");
        driver.findElement(By.id("reg-password")).sendKeys("password123");
        driver.findElement(By.id("reg-confirm")).sendKeys("password456");
        
        driver.findElement(By.id("register-submit")).click();
        
        WebElement errorMsg = wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("alert-error")));
        Assert.assertTrue(errorMsg.getText().contains("Passwords do not match"), "Error message should be shown for password mismatch");
    }

    @Test(priority = 8)
    public void testLoginNavigation() {
        driver.get(baseUrl + "/register");
        WebElement loginLink = wait.until(ExpectedConditions.elementToBeClickable(By.xpath("//a[contains(text(), 'Log in')]")));
        loginLink.click();
        wait.until(ExpectedConditions.urlContains("/login"));
        Assert.assertTrue(driver.getCurrentUrl().contains("/login"), "Should navigate to login page");
    }

    @Test(priority = 9)
    public void testLoginEmptyFields() {
        driver.get(baseUrl + "/login");
        WebElement submitBtn = wait.until(ExpectedConditions.elementToBeClickable(By.id("login-submit")));
        submitBtn.click();
        
        WebElement errorMsg = wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("alert-error")));
        Assert.assertTrue(errorMsg.getText().contains("Please enter your email address"), "Error message should be shown for empty email");
    }

    @Test(priority = 10)
    public void testLoginInvalidCredentials() {
        driver.get(baseUrl + "/login");
        driver.findElement(By.id("login-email")).sendKeys("invalid@example.com");
        driver.findElement(By.id("login-password")).sendKeys("wrongpassword");
        driver.findElement(By.id("login-submit")).click();
        
        WebElement errorMsg = wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("alert-error")));
        Assert.assertTrue(errorMsg.isDisplayed(), "Error message should be shown for invalid login");
    }

    @Test(priority = 11)
    public void testNavigateToUploadsWithoutLogin() {
        // Upload page should redirect to login if not authenticated
        driver.get(baseUrl + "/upload");
        wait.until(ExpectedConditions.urlContains("/login"));
        Assert.assertTrue(driver.getCurrentUrl().contains("/login"), "Unauthenticated user should be redirected to login");
    }

    @Test(priority = 12)
    public void testNavigateToMyUploadsWithoutLogin() {
        // My Uploads page should redirect to login if not authenticated
        driver.get(baseUrl + "/my-uploads");
        wait.until(ExpectedConditions.urlContains("/login"));
        Assert.assertTrue(driver.getCurrentUrl().contains("/login"), "Unauthenticated user should be redirected to login");
    }

    @Test(priority = 13)
    public void testNavigateToMCQs() {
        driver.get(baseUrl);
        WebElement mcqsLink = wait.until(ExpectedConditions.elementToBeClickable(By.xpath("//a[contains(text(), 'MCQs') and contains(@class, 'navbar')] | //a[contains(@href, '/mcqs')]")));
        mcqsLink.click();
        wait.until(ExpectedConditions.urlContains("/mcqs"));
        Assert.assertTrue(driver.getCurrentUrl().contains("/mcqs"), "Should navigate to MCQs page");
    }

    @Test(priority = 14)
    public void testFooterExists() {
        driver.get(baseUrl);
        WebElement footer = wait.until(ExpectedConditions.presenceOfElementLocated(By.tagName("footer")));
        Assert.assertTrue(footer.isDisplayed(), "Footer should be visible on the page");
    }

    @Test(priority = 15)
    public void testRegistrationSuccess() {
        driver.get(baseUrl + "/register");
        String uniqueEmail = "user" + UUID.randomUUID().toString().substring(0, 8) + "@example.com";
        
        driver.findElement(By.id("reg-name")).sendKeys("Automated Tester");
        driver.findElement(By.id("reg-email")).sendKeys(uniqueEmail);
        driver.findElement(By.id("reg-password")).sendKeys("password123");
        driver.findElement(By.id("reg-confirm")).sendKeys("password123");
        
        driver.findElement(By.id("register-submit")).click();
        
        // Wait for redirect to home or successful login state
        wait.until(ExpectedConditions.urlToBe(baseUrl + "/"));
        Assert.assertEquals(driver.getCurrentUrl(), baseUrl + "/", "Successful registration should redirect to home");
        
        // Verify logout button or user avatar is visible
        WebElement logoutBtn = wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath("//button[contains(text(), 'Logout')]")));
        Assert.assertTrue(logoutBtn.isDisplayed(), "Logout button should be visible after successful registration");
    }

    @Test(priority = 16)
    public void testLogout() {
        // Relies on user being logged in from previous test
        driver.get(baseUrl);
        WebElement logoutBtn = wait.until(ExpectedConditions.elementToBeClickable(By.xpath("//button[contains(text(), 'Logout')]")));
        logoutBtn.click();
        
        // Verify login/register links appear
        WebElement loginLink = wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath("//a[contains(text(), 'Log In')]")));
        Assert.assertTrue(loginLink.isDisplayed(), "Login link should be visible after logout");
    }

    @AfterClass
    public void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }
}
