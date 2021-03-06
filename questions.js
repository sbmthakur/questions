let puppeteer = require('puppeteer');
let nodemailer = require('nodemailer');
let sgTransport = require('nodemailer-sendgrid-transport');

let options = {
  auth: {
    api_user: 'xx',
    api_key: 'xx'
  }
};

let client = nodemailer.createTransport(sgTransport(options));

(async () => {
  try {
    let launchOptions = { 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    };

    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    let url = `https://quora.com`;
    await page.goto(url, { timeout: 60000 });
    await page.waitFor(5000)

    // Login
    let emailSel = '[name="email"]';
    let passwordSel = '.regular_login [name="password"]'
    let loginButton = '.regular_login .submit_button';

    await page.type(emailSel, 'xx');
    //TODO: remove hard-coded timeout
    await page.waitFor(5000)
    await page.type(passwordSel, 'xx');

    await page.click(loginButton)
    //TODO: remove hard-coded timeout
    await page.waitFor(10000);


    let questions = await page.evaluate(() => {
      return new Promise(resolve => {
        let questions = {};
        let id; 
        let questionSel = '.QuestionStory a.question_link';

        let runFn = () => {
          let questionElements = document.querySelectorAll(questionSel);
          console.log('number of questions: ', questionElements.length)
          for(let element of questionElements) {
            let text = element.querySelector('span span').innerText;
            let link = element.href; 
            
            if(!Object.prototype.hasOwnProperty.call(questions, text)) {
              questions[text] = link;
            }
          }

          if(Object.keys(questions).length > 10) {
            clearInterval(id);
            resolve(questions);
          } else {
            console.log('scrolling...')
            window.scrollBy(0, window.innerHeight);
          }
        }

        id = setInterval(runFn, 5000);
      });
    });

    //console.log('Questions found:', questions)
    // put this in finally
    await browser.close();
    let html = '<html>';
    Object.keys(questions).forEach(key => {
      let anchorElement = `<a style="display: block" href="${questions[key]}">`;
      
      if(questions[key].includes('unanswered')) {
        anchorElement += `<b>Unanswered</b> - ${key}</a>`;
      }
      else {
        anchorElement += `${key}</a>`;
      }
      html += anchorElement;
    });

    html += '</html>';

    //console.log(html)
    let email = {
      from: 'sbmthakur@gmail.com',
      to: 'sbmthakur@gmail.com',
      subject: 'Questions from Quora',
      html: html
    };
    client.sendMail(email);
    
  } catch(err) {
    console.log('some err: ', err.message)
  }
})();
