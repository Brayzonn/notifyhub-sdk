import axios, { AxiosInstance } from "axios";
import {
  NotifyHubConfig,
  SendEmailOptions,
  SendWebhookOptions,
  JobResponse,
  JobStatus,
  DomainStatusResponse,
  DomainVerificationResponse,
  DomainInfoResponse,
} from "./types";
import { NotifyHubError } from "./errors";

export class NotifyHubClient {
  private client: AxiosInstance;

  constructor(config: NotifyHubConfig) {
    if (!config.apiKey) {
      throw new Error("API key is required");
    }

    this.client = axios.create({
      baseURL: config.baseUrl || "https://api.notifyhub.com",
      headers: {
        "X-API-Key": config.apiKey,
        "Content-Type": "application/json",
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const message = error.response?.data?.message || error.message;
        const statusCode = error.response?.status;
        throw new NotifyHubError(message, statusCode, error.response?.data);
      }
    );
  }

  /**
   * Send an email notification
   */
  async sendEmail(options: SendEmailOptions): Promise<JobResponse> {
    const response = await this.client.post(
      "/api/v1/notifications/email",
      options
    );
    return response.data.data;
  }

  /**
   * Send a webhook notification
   */
  async sendWebhook(options: SendWebhookOptions): Promise<JobResponse> {
    const response = await this.client.post(
      "/api/v1/notifications/webhook",
      options
    );
    return response.data.data;
  }

  /**
   * Get job status by ID
   */
  async getJob(jobId: string): Promise<JobStatus> {
    const response = await this.client.get(
      `/api/v1/notifications/jobs/${jobId}`
    );
    return response.data.data;
  }

  /**
   * List jobs with optional filters
   */
  async listJobs(options?: {
    page?: number;
    limit?: number;
    type?: "email" | "webhook";
    status?: "pending" | "processing" | "completed" | "failed";
  }): Promise<{ data: JobStatus[]; pagination: any }> {
    const response = await this.client.get("/api/v1/notifications/jobs", {
      params: options,
    });
    return response.data.data;
  }

  /**
   * Retry a failed job
   */
  async retryJob(jobId: string): Promise<JobResponse> {
    const response = await this.client.post(
      `/api/v1/notifications/jobs/${jobId}/retry`
    );
    return response.data.data;
  }

  /**
   * Request domain verification
   */
  async requestDomainVerification(
    domain: string
  ): Promise<DomainVerificationResponse> {
    const response = await this.client.post(
      "/api/v1/customers/domain/request",
      { domain }
    );
    return response.data;
  }

  /**
   * Check domain verification status
   */
  async verifyDomain(): Promise<DomainStatusResponse> {
    const response = await this.client.post("/api/v1/customers/domain/verify");
    return response.data;
  }

  /**
   * Get domain configuration status
   */
  async getDomainStatus(): Promise<DomainInfoResponse> {
    const response = await this.client.get("/api/v1/customers/domain/status");
    return response.data;
  }

  /**
   * Remove domain configuration
   */
  async removeDomain(): Promise<{ message: string }> {
    const response = await this.client.delete("/api/v1/customers/domain");
    return response.data;
  }
}
