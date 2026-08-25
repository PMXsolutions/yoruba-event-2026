import axiosInstance from "@/libs/axiosInstance";
import { ReportFormState, ShiftReport } from "@/types/report";
import { DocumentPickerAsset } from "expo-document-picker";

interface reqBodyType {
  docFile: DocumentPickerAsset | null;
  companyId: number | undefined;
  docuName: string;
  expirationDate: string;
  staffName: string | undefined;
}

const getDocumentMimeType = (file: DocumentPickerAsset) => {
  if (file.mimeType) return file.mimeType;

  const extension = file.name.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "pdf":
      return "application/pdf";
    case "doc":
      return "application/msword";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    default:
      return "application/octet-stream";
  }
};

const fetchStaffReport = async (staffId: number) => {
  try {
    const { data } = await axiosInstance.get(
      `/ShiftReports/get_staff_shiftreports?staffId=${staffId}`
    );
    return data;
  } catch (error) {
    throw new Error("Unable to fetch shift reports");
  }
};
const fetchStaffKm = async (
  shiftId: number,
  startKm: number,
  endKm: number
) => {
  try {
    const { data } = await axiosInstance.get(
      `/ShiftRosters/fill_mileage?shiftId=${shiftId}&startKm=${startKm}&endKm=${endKm}`
    );
    return data;
  } catch (error) {
    throw new Error("Unable to update shift distance");
  }
};

const fetchReportInfo = async (
  reportId: number,
  shiftId: number,
  clientId?: number
) => {
  try {
    const clientQuery =
      clientId && clientId > 0 ? `&clientId=${clientId}` : "";
    const response = await axiosInstance.get(
      `/ShiftReports/get_shiftreport_details?id=${reportId}&shiftId=${shiftId}${clientQuery}`,
      {
        headers: {
          "Cache-Control": "no-cache",
        },
      }
    );

    return response.data;
  } catch (error) {
    throw new Error("Unable to fetch report details");
  }
};

const submitShiftForm = async (userId: string, formInfo: ReportFormState) => {
  return axiosInstance.post(
    `/ShiftReports/add_shiftreport?userId=${userId}`,
    formInfo
  );
};

const handleEditShiftForm = async (
  shiftReportId: number,
  userId: string,
  formInfo: ShiftReport
) => {
  return axiosInstance.post(
    `/ShiftReports/edit/${shiftReportId}?userId=${userId}`,
    formInfo
  );
};
const fetchStaffDocument = async (staffId: number) => {
  try {
    const { data } = await axiosInstance.get(
      `/Documents/get_all_staff_documents?staffId=${staffId}`
    );
    return data.staffDocuments;
  } catch (error) {
    throw new Error("Unable to fetch staff documents");
  }
};
const fetchStaffDocumentDetail = async (docId: number) => {
  try {
    const { data } = await axiosInstance.get(
      `/Documents/get_document/${docId}`
    );

    return data.staffDocument;
  } catch (error) {
    throw new Error("Unable to fetch staff document");
  }
};

const handleUploadStaffDocument = async (
  staffId: number,
  userId: string,
  formInfo: reqBodyType
) => {
  const formData = new FormData();

  if (formInfo?.docFile) {
    formData.append("DocumentFile", {
      uri: formInfo.docFile.uri, // Use the URI of the file
      name: formInfo.docFile.name, // Use the filename
      type: getDocumentMimeType(formInfo.docFile), // Use the MIME type
    } as unknown as Blob);
  }
  formData.append("CompanyId", formInfo.companyId?.toString() as string); // Using optional chaining and nullish coalescing
  formData.append("DocumentName", formInfo.docuName);
  formData.append("ExpirationDate", formInfo.expirationDate);
  formData.append("User", formInfo?.staffName as string);
  formData.append("Status", "Pending");
  formData.append("UserRole", "Staff");
  formData.append("UserId", staffId.toString());

  return axiosInstance.post(
    `/Documents/add_document?userId=${userId}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
};
const handleEditStaffDocument = async (
  docId: number,
  staffId: number,
  userId: string,
  formInfo: reqBodyType
) => {
  const formData = new FormData();

  if (formInfo?.docFile) {
    formData.append("DocumentFile", {
      uri: formInfo.docFile.uri, // Use the URI of the file
      name: formInfo.docFile.name, // Use the filename
      type: getDocumentMimeType(formInfo.docFile), // Use the MIME type
    } as unknown as Blob);
  }

  formData.append("CompanyId", formInfo.companyId?.toString() as string); // Using optional chaining and nullish coalescing
  formData.append("DocumentId", docId?.toString() as string); // Using optional chaining and nullish coalescing
  formData.append("DocumentName", formInfo.docuName);
  formData.append("ExpirationDate", formInfo.expirationDate);
  formData.append("User", formInfo?.staffName as string);
  formData.append("Status", "Pending");
  formData.append("UserRole", "Staff");
  formData.append("UserId", staffId.toString());

  return axiosInstance.post(
    `/Documents/edit/${docId}?userId=${userId}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
};

const handleDeleteDoc = async (id: number) => {
  return axiosInstance.post(`/Documents/delete/${id}`);
};

export const reportService = {
  fetchStaffReport,
  fetchReportInfo,
  handleEditShiftForm,
  fetchStaffDocument,
  handleUploadStaffDocument,
  submitShiftForm,
  handleDeleteDoc,
  fetchStaffDocumentDetail,
  handleEditStaffDocument,
  fetchStaffKm,
};
