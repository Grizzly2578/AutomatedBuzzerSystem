#include <Arduino.h>

#include <WiFi.h>
#include <Wire.h>
#include <SPIFFS.h>
#include <RTClib.h>
#include <WebServer.h>
#include <ArduinoJson.h>

RTC_DS3231 rtc;
#define RELAY_PIN 23
#define BUTTON_PIN 13

const char* ssid = "Starlink 10G";
const char* password = "1Smartbro";
WebServer server(80);

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  digitalWrite(RELAY_PIN, HIGH);
  


  if(!SPIFFS.begin(true)){
    return;
  }

  Wire.begin();
  if (!rtc.begin()) {
    return;
  }

  IPAddress local_IP(192, 168, 1, 69);
  IPAddress gateway(192, 168, 1, 1);
  IPAddress subnet(255, 255, 255, 0);
  
  WiFi.config(local_IP, gateway, subnet);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  unsigned long startAttemptTime = millis();
  const unsigned long wifiTimeout = 10000; // 10 seconds timeout

  while (WiFi.status() != WL_CONNECTED && millis() - startAttemptTime < wifiTimeout) {
    delay(500);
  }
  
  if (WiFi.status() == WL_CONNECTED) {
  // < -------------- Files --------------- >
  server.on("/", []() {
    File file = SPIFFS.open("/index.html", "r");
    server.streamFile(file, "text/html");
    file.close();
  });

  server.on("/style.css", []() {
    File file = SPIFFS.open("/style.css", "r");
    server.streamFile(file, "text/css");
    file.close();
  });
  server.on("/loader.css", []() {
    File file = SPIFFS.open("/loader.css", "r");
    server.streamFile(file, "text/css");
    file.close();
  });
  
  server.on("/main.js", []() {
    File file = SPIFFS.open("/main.js", "r");
    server.streamFile(file, "application/javascript");
    file.close();
  });

  server.on("/alarms.json", []() {
    File file = SPIFFS.open("/alarms.json", "r");
    server.streamFile(file, "application/json");
    file.close();
  });

  // < -------------- API --------------- >

  server.on("/server-time", []() {
    DateTime now = rtc.now();
    char timeString[9];
    sprintf(timeString, "%02d:%02d:%02d", now.hour(), now.minute(), now.second());
    String json = "{\"serverTime\": \"" + String(timeString) + "\"}";
    server.send(200, "application/json", json);
  });

  server.on("/server-date", []() {
    DateTime now = rtc.now();
    char dateString[20];
    sprintf(dateString, "%04d-%02d-%02dT%02d:%02d:%02d", 
        now.year(), now.month(), now.day(), 
        now.hour(), now.minute(), now.second());
    String json = "{\"serverDate\": \"" + String(dateString) + "\"}";
    server.send(200, "application/json", json);
  });

  server.on("/set-datetime", HTTP_POST, []() {
    if (!server.hasArg("plain")) {
      server.send(400, "application/json", "{\"error\": \"No data received\"}");
      return;
    }

    StaticJsonDocument<200> doc;
    DeserializationError error = deserializeJson(doc, server.arg("plain"));

    if (error) {
      server.send(400, "application/json", "{\"error\": \"Invalid JSON\"}");
      return;
    }

    const char* datetimeStr = doc["datetime"];
    int year, month, day, hour, minute;
    sscanf(datetimeStr, "%d-%d-%dT%d:%d", &year, &month, &day, &hour, &minute);
    
    rtc.adjust(DateTime(year, month, day, hour, minute, 0));
    
    server.send(200, "application/json", "{\"success\": true}");
  });

  

  server.on("/save-alarms", HTTP_POST, []() {
    if (!server.hasArg("plain")) {
        server.send(400, "application/json", "{\"error\": \"No data received\"}");
        return;
    }

    String jsonString = server.arg("plain");
    File file = SPIFFS.open("/alarms.json", "w");
    
    if (!file) {
        server.send(500, "application/json", "{\"error\": \"Failed to open file\"}");
        return;
    }

    if (file.print(jsonString)) {
        file.close();
        server.send(200, "application/json", "{\"success\": true}");
    } else {
        file.close();
        server.send(500, "application/json", "{\"error\": \"Failed to write file\"}");
    }
});
  

  server.begin();
} else {
  Serial.println("WiFi connection failed");
  return;
  }
}

void triggerbuzzer(int duration, int repeat, int _delay) {
  for (int i = 0; i < repeat; i++) {
    digitalWrite(RELAY_PIN, LOW);
    delay(duration);
    digitalWrite(RELAY_PIN, HIGH);
    delay(_delay); // Add a delay between repeats if needed
  }
}

bool checkAlarms() {
  DateTime now = rtc.now();
  File file = SPIFFS.open("/alarms.json", "r");
  if (!file) return false;

  StaticJsonDocument<1024> doc;
  DeserializationError error = deserializeJson(doc, file);
  file.close();
  
  if (error) return false;

  JsonArray alarms = doc.as<JsonArray>();  // Direct array, not doc["alarms"]
  
  for (JsonVariant alarm : alarms) {
    if (!alarm["active"].as<bool>()) continue;  // Changed from enabled to active

    String alarmTime = alarm["time"].as<String>();
    int alarmHour = alarmTime.substring(0, 2).toInt();
    int alarmMinute = alarmTime.substring(3, 5).toInt();
    
    if (now.hour() == alarmHour && 
        now.minute() == alarmMinute && 
        now.second() == 0) {
      
      JsonArray weekdays = alarm["weekdays"]; 
      int today = now.dayOfTheWeek();
      
      for (int day : weekdays) {
        if (day == today) {
          String lastRanDay = alarm["lastRanDay"] | "";
          String currentDate = String(now.year()) + "-" + 
                             String(now.month()) + "-" + 
                             String(now.day());
          
          if (lastRanDay != currentDate) {
            triggerbuzzer(alarm["duration"].as<int>(), alarm["repeat"].as<int>(), alarm["delay"].as<int>());  // Use duration field
            
            alarm["lastRanDay"] = currentDate;
            File wFile = SPIFFS.open("/alarms.json", "w");
            if (wFile) {
              serializeJson(doc, wFile);
              wFile.close();
            }
            return true; // Alarm triggered
          }
        }
      }
    }
  }
  return false; // No alarms triggered
}

void enterDeepSleepUntil(DateTime wakeTime) {
  DateTime now = rtc.now();
  int sleepDuration = (wakeTime.unixtime() - now.unixtime()) * 1000000; // Convert to microseconds
  if (sleepDuration > 0) {
    esp_sleep_enable_timer_wakeup(sleepDuration);
    esp_deep_sleep_start();
  }
}

void loop() {
  server.handleClient();
  checkAlarms();
  
  if (digitalRead(BUTTON_PIN) == LOW) {
    digitalWrite(RELAY_PIN, LOW); // Turn on relay when button is pressed
  } else {
    digitalWrite(RELAY_PIN, HIGH); // Turn off relay when button is released
  }

  DateTime now = rtc.now();
  if (now.hour() == 22 && now.minute() == 0) { // 10 PM
    DateTime wakeTime(now.year(), now.month(), now.day() + 1, 4, 30, 0); // 4:30 AM next day
    enterDeepSleepUntil(wakeTime);
  }

  delay(100);
}