package tn.esprit.backend.service;

import tn.esprit.backend.dto.request.*;
import tn.esprit.backend.dto.response.*;

import java.util.List;

public interface ISubscriptionService {
    SubscriptionResponse subscribe(Long userId, SubscriptionRequest request);
    SubscriptionResponse getActiveSubscription(Long userId);
    SubscriptionResponse changePlan(Long subscriptionId, SubscriptionRequest request);
    void                 cancel(Long subscriptionId);
    List<InvoiceResponse> getInvoices(Long userId);
    byte[]               getInvoicePdf(Long invoiceId);
}