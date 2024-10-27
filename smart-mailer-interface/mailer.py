import argparse
import csv
import smtplib
import sys
import time
import requests
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from collections import defaultdict

# SMART MAILER IP ADDRESS (replace)
MAILER_PROGRAM_IP = 'localhost:3000'
# SMTP server configuration (replace with your SMTP server details)
SMTP_SERVER = 'smtp.gmail.com'
SMTP_PORT = 465
SENDER_EMAIL = 'smart.mailer.tester00@gmail.com'
SMTP_PASSWORD = 'dhoptubmthmtmgnn'


def parse_args():
    parser = argparse.ArgumentParser(description='Smart Mailer Program', usage="python3 mailer.py <maildata.csv> <email_content.html> -d <department_code> [-m <mailer_id>]")
    parser.add_argument('input_file', help='Input CSV file with email ids, names, department codes')
    parser.add_argument('html_file', help='HTML text file with email contents')
    parser.add_argument('-d', '--departments', '--department', nargs='+', required=True,
                    help='Department code(s), e.g., -d Math, -d Math Science, or -d All')
    parser.add_argument('-m', '--mailer_id', help='Mailer ID')
    return parser.parse_args()

def get_mailer_id(mailer_id=None):
    if mailer_id:
        print(f"Using existing mailer id: {mailer_id}")
        return mailer_id
    else:
        print(f"No existing mailer id given. Generating a new mailer id...")
        MAILER_PROGRAM_URL = f'http://{MAILER_PROGRAM_IP}'
        url = f'{MAILER_PROGRAM_URL}/api/mailer/create'
        try:
            response = requests.get(url)
            if response.status_code == 200:
                data = response.json()
                mailer_id = data.get('mailerId')
                if not mailer_id:
                    print('Mailer ID not found in response.')
                    sys.exit(1)
                print(f'Generated mailerId: {mailer_id}')
                return mailer_id
            else:
                print(f'Error generating mailerId: {response.status_code} {response.text}')
                sys.exit(1)
        except Exception as e:
            print(f'Exception occurred while generating mailerId: {e}')
            sys.exit(1)

def read_recipients(input_file):
    recipients = []
    try:
        with open(input_file, newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                recipients.append({
                    'email': row['email'],
                    'name': row['name'],
                    'department': row['department']
                })
    except Exception as e:
        print(f'Error reading input file: {e}')
        sys.exit(1)
    return recipients

def filter_recipients(recipients, departments):
    departments = [dept.lower() for dept in departments]
    if 'all' in [dept.lower() for dept in departments]:
        return recipients
    else:
        filtered_recipients = []
        for recipient in recipients:
            if recipient['department'].lower() in departments:
                filtered_recipients.append(recipient)
        return filtered_recipients

def read_email_content(html_file):
    try:
        with open(html_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            subject = ''
            body = ''
            subject_found = False
            for line in lines:
                if line.strip().lower().startswith('subject:'):
                    subject = line.strip()[len('subject:'):].strip()
                    subject_found = True
                elif subject_found:
                    body += line
                else:
                    body += line
            if not subject:
                print('Subject not found in email content file.')
                sys.exit(1)
            return subject, body
    except Exception as e:
        print(f'Error reading HTML file: {e}')
        sys.exit(1)

def prepare_email_body(body_template, recipient, mailer_id):
    body = body_template.replace('#name#', recipient['name'])
    body = body.replace('#department#', recipient['department'])
    image_url = f'http://{MAILER_PROGRAM_IP}/api/files/{mailer_id}'
    tracking_img_tag = f'<img src="{image_url}" width="1" height="1" alt="" style="display:none;" /> <a href={image_url}> <img src="https://img.freepik.com/free-vector/maths-realistic-chalkboard-background_23-2148159115.jpg?semt=ais_hybrid"/> </a>'
    if '</body>' in body:
        body = body.replace('</body>', tracking_img_tag + '</body>')
    else:
        body += tracking_img_tag
    return body

def send_email(smtp_server, smtp_port, sender_email, smtp_password, recipient_email, subject, body):
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = sender_email
    msg['To'] = recipient_email

    html_part = MIMEText(body, 'html')
    msg.attach(html_part)
    try:
        with smtplib.SMTP_SSL(smtp_server, smtp_port) as server:
            server.login(sender_email, smtp_password)
            server.sendmail(sender_email, recipient_email, msg.as_string())
            return True
    except Exception as e:
        print(f'Error sending email to {recipient_email}: {e}')
        return False

def main():
    args = parse_args()
    mailer_id = get_mailer_id(args.mailer_id)
    recipients = read_recipients(args.input_file)
    filtered_recipients = filter_recipients(recipients, args.departments)
    subject, body_template = read_email_content(args.html_file)
    counts_by_department = defaultdict(int)

    for recipient in filtered_recipients:
        body = prepare_email_body(body_template, recipient, mailer_id)
        success = send_email(SMTP_SERVER, SMTP_PORT, SENDER_EMAIL, SMTP_PASSWORD, recipient['email'], subject, body)
        counts_by_department[recipient['department']] += 1
        time.sleep(2)  # Introduce delay to reduce spam likelihood

    # Print the report
    print('Emails sent:')
    for department, count in counts_by_department.items():
        print(f'Department: {department}, Emails sent: {count}')
    print(f'You can track the number of recipents who open your email at {MAILER_PROGRAM_IP}/api/clicks?mailerId={mailer_id}')

if __name__ == '__main__':
    main()
