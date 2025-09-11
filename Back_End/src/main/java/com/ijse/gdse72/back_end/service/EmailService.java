package com.ijse.gdse72.back_end.service;

public interface EmailService {

    void sendEmail(String to, String subject, String body);

    void sendHtmlEmail(String to, String subject, String htmlContent);
}