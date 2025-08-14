"""
Advanced Website Performance Testing with Selenium
Supports multiple browsers and comprehensive testing scenarios
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.firefox.options import Options as FirefoxOptions
from selenium.common.exceptions import TimeoutException, WebDriverException
import time
import requests
from urllib.parse import urljoin, urlparse
import json
import concurrent.futures
from datetime import datetime
import statistics

class WebsitePerformanceTester:
    def __init__(self):
        self.results = {}
        self.browsers = ['chrome', 'firefox']
        
    def setup_driver(self, browser='chrome', mobile=False):
        """Setup WebDriver for different browsers and devices"""
        if browser == 'chrome':
            options = ChromeOptions()
            options.add_argument('--headless')
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-dev-shm-usage')
            
            if mobile:
                mobile_emulation = {"deviceName": "iPhone X"}
                options.add_experimental_option("mobileEmulation", mobile_emulation)
                
            return webdriver.Chrome(options=options)
            
        elif browser == 'firefox':
            options = FirefoxOptions()
            options.add_argument('--headless')
            
            if mobile:
                options.set_preference("general.useragent.override", 
                    "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)")
                    
            return webdriver.Firefox(options=options)
    
    def measure_page_load_time(self, url, browser='chrome'):
        """Measure detailed page load metrics"""
        driver = self.setup_driver(browser)
        
        try:
            # Start timing
            start_time = time.time()
            
            # Navigate to page
            driver.get(url)
            
            # Wait for page to be ready
            WebDriverWait(driver, 30).until(
                lambda d: d.execute_script("return document.readyState") == "complete"
            )
            
            end_time = time.time()
            load_time = end_time - start_time
            
            # Get performance metrics using JavaScript
            performance_data = driver.execute_script("""
                var perfData = performance.getEntriesByType('navigation')[0];
                return {
                    domContentLoaded: perfData.domContentLoadedEventEnd - perfData.navigationStart,
                    loadComplete: perfData.loadEventEnd - perfData.navigationStart,
                    firstPaint: performance.getEntriesByType('paint')[0] ? 
                        performance.getEntriesByType('paint')[0].startTime : null,
                    firstContentfulPaint: performance.getEntriesByType('paint')[1] ? 
                        performance.getEntriesByType('paint')[1].startTime : null
                };
            """)
            
            return {
                'total_load_time': load_time,
                'dom_content_loaded': performance_data['domContentLoaded'] / 1000,
                'load_complete': performance_data['loadComplete'] / 1000,
                'first_paint': performance_data['firstPaint'] / 1000 if performance_data['firstPaint'] else None,
                'first_contentful_paint': performance_data['firstContentfulPaint'] / 1000 if performance_data['firstContentfulPaint'] else None,
                'browser': browser
            }
            
        except Exception as e:
            return {'error': str(e), 'browser': browser}
        finally:
            driver.quit()
    
    def check_broken_links(self, url, max_links=50):
        """Check for broken links on the page"""
        driver = self.setup_driver()
        broken_links = []
        
        try:
            driver.get(url)
            
            # Find all links
            links = driver.find_elements(By.TAG_NAME, 'a')[:max_links]
            
            for link in links:
                href = link.get_attribute('href')
                if href and href.startswith(('http://', 'https://')):
                    try:
                        response = requests.head(href, timeout=10, allow_redirects=True)
                        if response.status_code >= 400:
                            broken_links.append({
                                'url': href,
                                'status_code': response.status_code,
                                'text': link.text[:50]
                            })
                    except requests.RequestException:
                        broken_links.append({
                            'url': href,
                            'status_code': 'timeout/error',
                            'text': link.text[:50]
                        })
                        
        except Exception as e:
            return {'error': str(e)}
        finally:
            driver.quit()
            
        return broken_links
    
    def test_mobile_responsiveness(self, url):
        """Test mobile responsiveness and viewport handling"""
        mobile_driver = self.setup_driver(mobile=True)
        desktop_driver = self.setup_driver(mobile=False)
        
        try:
            # Test mobile version
            mobile_driver.get(url)
            mobile_width = mobile_driver.execute_script("return window.innerWidth")
            mobile_height = mobile_driver.execute_script("return window.innerHeight")
            
            # Check for mobile-specific elements
            mobile_nav = len(mobile_driver.find_elements(By.CSS_SELECTOR, 
                ".mobile-nav, .hamburger, .menu-toggle, [class*='mobile']"))
            
            # Test desktop version
            desktop_driver.get(url)
            desktop_width = desktop_driver.execute_script("return window.innerWidth")
            
            # Check responsive design indicators
            has_viewport_meta = len(mobile_driver.find_elements(By.CSS_SELECTOR, 
                "meta[name='viewport']")) > 0
            
            # Calculate responsiveness score
            score = 70  # Base score
            if has_viewport_meta:
                score += 15
            if mobile_nav > 0:
                score += 10
            if mobile_width < desktop_width:
                score += 5
                
            return {
                'mobile_width': mobile_width,
                'mobile_height': mobile_height,
                'desktop_width': desktop_width,
                'has_viewport_meta': has_viewport_meta,
                'mobile_nav_elements': mobile_nav,
                'responsiveness_score': min(100, score)
            }
            
        except Exception as e:
            return {'error': str(e)}
        finally:
            mobile_driver.quit()
            desktop_driver.quit()
    
    def simulate_user_interactions(self, url):
        """Simulate common user interactions and measure response times"""
        driver = self.setup_driver()
        interactions = []
        
        try:
            driver.get(url)
            
            # Test form interactions
            forms = driver.find_elements(By.TAG_NAME, 'form')
            for i, form in enumerate(forms[:3]):  # Test up to 3 forms
                try:
                    inputs = form.find_elements(By.TAG_NAME, 'input')
                    if inputs:
                        start_time = time.time()
                        inputs[0].click()
                        inputs[0].send_keys('test@example.com')
                        end_time = time.time()
                        
                        interactions.append({
                            'type': 'form_input',
                            'form_index': i,
                            'response_time': end_time - start_time
                        })
                except Exception:
                    pass
            
            # Test button clicks
            buttons = driver.find_elements(By.TAG_NAME, 'button')
            for i, button in enumerate(buttons[:5]):  # Test up to 5 buttons
                try:
                    if button.is_displayed() and button.is_enabled():
                        start_time = time.time()
                        button.click()
                        time.sleep(0.5)  # Wait for any animations
                        end_time = time.time()
                        
                        interactions.append({
                            'type': 'button_click',
                            'button_index': i,
                            'response_time': end_time - start_time
                        })
                except Exception:
                    pass
                    
        except Exception as e:
            return {'error': str(e)}
        finally:
            driver.quit()
            
        return interactions
    
    def load_test_simulation(self, url, concurrent_users=10, duration=30):
        """Simulate multiple concurrent users"""
        def single_user_test():
            start_time = time.time()
            try:
                response = requests.get(url, timeout=30)
                end_time = time.time()
                return {
                    'response_time': end_time - start_time,
                    'status_code': response.status_code,
                    'success': response.status_code < 400
                }
            except Exception as e:
                return {
                    'response_time': None,
                    'status_code': None,
                    'success': False,
                    'error': str(e)
                }
        
        results = []
        start_time = time.time()
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=concurrent_users) as executor:
            while time.time() - start_time < duration:
                futures = [executor.submit(single_user_test) for _ in range(concurrent_users)]
                
                for future in concurrent.futures.as_completed(futures):
                    results.append(future.result())
                
                time.sleep(1)  # Brief pause between batches
        
        # Analyze results
        successful_requests = [r for r in results if r['success']]
        failed_requests = [r for r in results if not r['success']]
        response_times = [r['response_time'] for r in successful_requests if r['response_time']]
        
        return {
            'total_requests': len(results),
            'successful_requests': len(successful_requests),
            'failed_requests': len(failed_requests),
            'success_rate': len(successful_requests) / len(results) * 100 if results else 0,
            'avg_response_time': statistics.mean(response_times) if response_times else None,
            'min_response_time': min(response_times) if response_times else None,
            'max_response_time': max(response_times) if response_times else None,
            'median_response_time': statistics.median(response_times) if response_times else None
        }
    
    def run_comprehensive_test(self, url, config=None):
        """Run all tests and generate comprehensive report"""
        if config is None:
            config = {
                'browsers': ['chrome'],
                'mobile_test': True,
                'link_check': True,
                'interaction_test': True,
                'load_test': True,
                'concurrent_users': 10,
                'load_duration': 30
            }
        
        print(f"Starting comprehensive performance test for: {url}")
        results = {
            'url': url,
            'timestamp': datetime.now().isoformat(),
            'config': config
        }
        
        # Page load time tests
        print("Testing page load times...")
        load_times = {}
        for browser in config['browsers']:
            load_times[browser] = self.measure_page_load_time(url, browser)
        results['load_times'] = load_times
        
        # Broken link check
        if config['link_check']:
            print("Checking for broken links...")
            results['broken_links'] = self.check_broken_links(url)
        
        # Mobile responsiveness
        if config['mobile_test']:
            print("Testing mobile responsiveness...")
            results['mobile_test'] = self.test_mobile_responsiveness(url)
        
        # User interaction simulation
        if config['interaction_test']:
            print("Simulating user interactions...")
            results['interactions'] = self.simulate_user_interactions(url)
        
        # Load testing
        if config['load_test']:
            print(f"Running load test with {config['concurrent_users']} concurrent users...")
            results['load_test'] = self.load_test_simulation(
                url, 
                config['concurrent_users'], 
                config['load_duration']
            )
        
        # Generate summary score
        results['performance_score'] = self.calculate_performance_score(results)
        
        print("Test completed!")
        return results
    
    def calculate_performance_score(self, results):
        """Calculate overall performance score based on all test results"""
        score = 100
        
        # Load time scoring
        load_times = results.get('load_times', {})
        for browser, data in load_times.items():
            if 'total_load_time' in data:
                load_time = data['total_load_time']
                if load_time > 5:
                    score -= 25
                elif load_time > 3:
                    score -= 15
                elif load_time > 2:
                    score -= 10
                elif load_time > 1:
                    score -= 5
        
        # Broken links penalty
        broken_links = results.get('broken_links', [])
        if isinstance(broken_links, list):
            score -= len(broken_links) * 10
        
        # Mobile responsiveness
        mobile_test = results.get('mobile_test', {})
        if 'responsiveness_score' in mobile_test:
            mobile_score = mobile_test['responsiveness_score']
            if mobile_score < 70:
                score -= 20
            elif mobile_score < 85:
                score -= 10
        
        # Load test results
        load_test = results.get('load_test', {})
        if 'success_rate' in load_test:
            success_rate = load_test['success_rate']
            if success_rate < 95:
                score -= (95 - success_rate) * 2
        
        return max(0, min(100, score))

# Example usage
if __name__ == "__main__":
    tester = WebsitePerformanceTester()
    
    # Test configuration
    test_config = {
        'browsers': ['chrome', 'firefox'],
        'mobile_test': True,
        'link_check': True,
        'interaction_test': True,
        'load_test': True,
        'concurrent_users': 25,
        'load_duration': 60
    }
    
    # Run test
    url = "https://example.com"  # Replace with actual URL
    results = tester.run_comprehensive_test(url, test_config)
    
    # Save results
    with open(f'performance_test_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\nPerformance Score: {results['performance_score']}/100")
    print(f"Results saved to performance_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
