from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form
from pydantic import BaseModel
from simple_salesforce import Salesforce, bulk
from dotenv import load_dotenv
import os
import json  # Import the json library
from fastapi.middleware.cors import CORSMiddleware
import simple_salesforce
import requests
from prompts import SUMMARY_PROMPT, EMAIL_DRAFT_PROMPT
from fastapi.responses import JSONResponse
import shutil
import tempfile
import groq

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
    expose_headers=["*"],
)

# Load environment variables from .env file
load_dotenv()

# Get Salesforce credentials from environment variables
SF_USERNAME = os.getenv('SF_USERNAME')
SF_PASSWORD = os.getenv('SF_PASSWORD')
SF_SECURITY_TOKEN = os.getenv('SF_SECURITY_TOKEN')

# Initialize Salesforce connection
sf = Salesforce(username=SF_USERNAME, password=SF_PASSWORD,
                security_token=SF_SECURITY_TOKEN)

# Pydantic models for the different Salesforce objects


class Opportunity(BaseModel):
    Id: str = None
    Name: str
    StageName: str
    CloseDate: str
    Amount: float


class Task(BaseModel):
    Id: str = None
    Subject: str
    Status: str
    Priority: str


class Account(BaseModel):
    Id: str = None
    Name: str


class Contact(BaseModel):
    Id: str = None
    FirstName: str
    LastName: str
    Email: str


class Lead(BaseModel):
    Id: str = None
    FirstName: str
    LastName: str
    Company: str
    Status: str


class Event(BaseModel):
    Id: str = None
    Subject: str
    StartDateTime: str
    EndDateTime: str

class TranscriptionResponse(BaseModel):
    text: str
    filename: str
    language: str

# Helper function to remove 'attributes' from records


def remove_attributes(records):
    for record in records:
        if 'attributes' in record:
            del record['attributes']
    return records

# General CRUD functions


def get_records(object_name):
    fields = [field['name']
              for field in sf.__getattr__(object_name).describe()['fields']]
    query = f"SELECT {', '.join(fields)} FROM {object_name}"
    result = sf.query_all(query)

# Collect all records
    records = result['records']

# Handle pagination
    while not result['done']:
        result = sf.query_more(result['nextRecordsUrl'], True)
        records.extend(result['records'])

# Print the total number of records retrieved
    print(f"Total records retrieved: {len(records)}")
    return remove_attributes(records)


def create_record(object_name, data):
    result = sf.__getattr__(object_name).create(data)
    return result


def update_record(object_name, record_id, data):
    result = sf.__getattr__(object_name).update(record_id, data)
    return result


def delete_record(object_name, record_id):
    try:
        result = sf.__getattr__(object_name).delete(record_id)
    except Exception as e:
        # Print the full exception for debugging purposes
        print(e.content)
        result = str(e)
    return result

# Unified endpoint for CRUD operations


def get_fields(object_name):
    fields = [field['name']
              for field in sf.__getattr__(object_name).describe()['fields']]
    query = f"SELECT {', '.join(fields)} FROM {object_name}"
    result = sf.query_all(query)
    return fields


def get_nec(object_name):
    describe = sf.__getattr__(object_name).describe()
    necessary_fields = [
        field['name'] for field in describe['fields']
        if not field['nillable'] and field['createable'] and not field.get('defaultedOnCreate', False) and not field.get('autoNumber', False)
    ]
    return necessary_fields


def write_fields():
    records = {"Opportunity": get_fields("Opportunity"),
               "Lead": get_fields("Lead"),
               "Account": get_fields("Account"),
               "Contact": get_fields("Contact"),
               "Task": get_fields("Task"),
               "Event": get_fields("Event")
               #    "Quote": get_fields("Quote")
               }
    return records


def write_nec():
    records = {"Opportunity": get_nec("Opportunity"),
               "Lead": get_nec("Lead"),
               "Account": get_nec("Account"),
               "Contact": get_nec("Contact"),
               "Task": get_nec("Task")
               }
    return records

@app.options("/{rest_of_path:path}")
async def preflight_handler(rest_of_path: str):
    return {}
@app.get("/")
async def pinger():
    return {"System is up and running"}


@app.post("/salesforce/fields")
async def salesforce_fields(request: Request):
    try:
        # Convert to JSON string and back to dict
        result = write_fields()
        return json.loads(json.dumps(result))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/salesforce/nec_fields")
async def nec_salesforce_fields(request: Request):
    try:
        # Convert to JSON string and back to dict
        result = write_nec()
        return json.loads(json.dumps(result))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/salesforce/create")
async def create_salesforce_record(request: Request):
    try:
        data = await request.json()
        object_name = data['object']
        record_data = data.get('data')
        print(record_data)
        print(data)
        result = create_record(object_name, record_data)
        # Convert to JSON string and back to dict
        print(result)
        return json.loads(json.dumps(result))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/salesforce/read")
async def read_salesforce_records(request: Request):
    try:
        data = await request.json()
        object_name = data['object']
        result = {object_name: get_records(object_name)}
        # Convert to JSON string and back to dict
        # result = get_records(object_name)
        return json.loads(json.dumps(result))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/salesforce/update")
async def update_salesforce_record(request: Request):
    try:
        data = await request.json()
        object_name = data['object']
        print(data)
        record_data = {data.get('field'): data.get('value')}
        print(record_data)
        record_id = data.get('id')
        result = update_record(object_name, record_id, record_data)
        print(result)
        # Convert to JSON string and back to dict
        return json.loads(json.dumps(result))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/salesforce/delete")
async def delete_salesforce_record(request: Request):
    try:
        print("------------------")
        data = await request.json()
        print("-----------1------------")
        print(data)
        object_name = data['object']
        print("-------------2---------------")
        record_id = data.get('id')
        print("--------------------")
        result = delete_record(object_name, record_id)
        print(result)
        # Convert to JSON string and back to dict
        return json.loads(json.dumps(result))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/salesforce/bulk_update")
async def bulk_update(request: Request):
    try:
        data = await request.json()
        # print(data)
        update_data = [
            {'Id': record_id, data.get('field'): data.get('value')}
            for record_id in data.get('id')
        ]
# Convert list of dictionaries to a pandas DataFrame for better visualization (optional)
# Use Salesforce Bulk API to perform the update
        bulk = sf.bulk.__getattr__(data['object']).update(
            update_data, batch_size=10000, use_serial=True)
        return bulk
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/salesforce/bulk_delete")
async def bulk_update(request: Request):
    try:
        data = await request.json()
        # print(data)
        update_data = [
            {'Id': record_id} for record_id in data.get('id')
        ]
# Convert list of dictionaries to a pandas DataFrame for better visualization (optional)
# Use Salesforce Bulk API to perform the update
        bulk = sf.bulk.__getattr__(data['object']).delete(
            update_data, batch_size=10000, use_serial=True)
        return bulk
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/summarise")
async def summarise_text(request: Request):
    try:
        data = await request.json()
        paragraph = data.get("paragraph")
        record_id = data.get("record_id")
        object_name = data.get("object")
        context = data.get("context")
        context_str = ""
        if context:
            context_str = "\n\nContext (all fields):\n" + json.dumps(context, indent=2)
            print("Queried Context Data:", context_str)  # Print context for debugging

        language = data.get("language", "en")
        language_label = {
            "en": "English", "hi": "Hindi", "bn": "Bengali", "te": "Telugu", "mr": "Marathi",
            "ta": "Tamil", "gu": "Gujarati", "kn": "Kannada", "ml": "Malayalam", "pa": "Punjabi",
            "ur": "Urdu", "es": "Spanish", "fr": "French", "de": "German"
        }.get(language, "English")

# For summary
        system_message = SUMMARY_PROMPT.format(
            language_code=language,
            context_data=context_str,
            note=paragraph
        )

# For email drafts
        email_prompt = EMAIL_DRAFT_PROMPT.format(
            language_code=language,
            context_data=context_str,
            note=paragraph
        )

        if not paragraph or not record_id or not object_name:
            raise HTTPException(status_code=400, detail="Missing required fields.")

        # Prepare Groq API call
        groq_api_key = os.getenv("GROQ_API_KEY")
        groq_url = "https://api.groq.com/openai/v1/chat/completions"

        headers = {
            "Authorization": f"Bearer {groq_api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "llama3-70b-8192",
            "messages": [
                {
                    "role": "system",
                    "content": system_message
                },
                {
                    "role": "user",
                    "content": f"Summarize the following note for CRM record {record_id} ({object_name}):\n\nNote:\n{paragraph}"
                }
            ],
            "max_tokens": 512,
            "temperature": 0.5
        }

        response = requests.post(groq_url, headers=headers, json=payload)
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail=f"Groq API error: {response.text}")

        summary = response.json()["choices"][0]["message"]["content"]
        return {"summary": summary, "context" : context_str}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/email_draft")
async def email_draft(request: Request):
    try:
        data = await request.json()
        paragraph = data.get("paragraph")
        record_id = data.get("record_id")
        object_name = data.get("object")
        context = data.get("context")
        email_type = data.get("email_type")  # e.g., "Follow-up Email"
        language = data.get("language", "en")
        context_str = ""
        if context:
            context_str = "\n\nContext (all fields):\n" + json.dumps(context, indent=2)
            print("Queried Context Data:", context_str)  # Print context for debugging

        if not paragraph or not record_id or not object_name or not email_type:
            raise HTTPException(status_code=400, detail="Missing required fields.")

        # Prepare the prompt for the LLM
        prompt = f"""
{EMAIL_DRAFT_PROMPT}

Email Type: {email_type}
Language Code: {language}
"""

        # Prepare Groq API call
        groq_api_key = os.getenv("GROQ_API_KEY")
        groq_url = "https://api.groq.com/openai/v1/chat/completions"

        headers = {
            "Authorization": f"Bearer {groq_api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "llama3-70b-8192",
            "messages": [
                {
                    "role": "system",
                    "content": prompt.format(
                        language_code=language,
                        context_data=context_str,
                        note=paragraph
                    )
                },
                {
                    "role": "user",
                    "content": f"Generate a {email_type} for CRM record {record_id} ({object_name}) using the above context and note. The email should be in the language and script specified by the language code."
                }
            ],
            "max_tokens": 512,
            "temperature": 0.5
        }

        response = requests.post(groq_url, headers=headers, json=payload)
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail=f"Groq API error: {response.text}")

        email_draft = response.json()["choices"][0]["message"]["content"]
        return {"email_draft": email_draft, "context": context_str}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


ALLOWED_EXTENSIONS = {".mp3", ".wav", ".m4a"}

def validate_audio_file(filename):
    ext = os.path.splitext(filename)[1].lower()
    return ext in ALLOWED_EXTENSIONS

groq_client = groq.Groq(api_key=os.getenv("GROQ_API_KEY"))

@app.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(
    file: UploadFile = File(...),
    language: str = Form("en"),
    prompt: str = Form(None),
    temperature: float = Form(0.0),
):
    if not validate_audio_file(file.filename):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp_file:
            shutil.copyfileobj(file.file, temp_file)
            temp_path = temp_file.name

        with open(temp_path, "rb") as audio_file:
            transcription = groq_client.audio.transcriptions.create(
                file=(file.filename, audio_file.read()),
                model="whisper-large-v3-turbo",
                prompt=prompt,
                response_format="json",
                language=language,
                temperature=temperature
            )

        os.unlink(temp_path)

        return TranscriptionResponse(
            text=transcription.text,
            filename=file.filename,
            language=language
        )

    except Exception as e:
        if 'temp_path' in locals() and os.path.exists(temp_path):
            os.unlink(temp_path)
        raise HTTPException(status_code=500, detail=str(e))


