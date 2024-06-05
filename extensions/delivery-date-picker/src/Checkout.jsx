import { useState, useCallback, useMemo, useEffect } from "react";
import {
  Heading,
  DatePicker,
  reactExtension,
  useSettings,
  useCartLines,
  useApi,
  useApplyMetafieldsChange,
  useMetafield,
  useAppMetafields,
  Text,
  Checkbox
} from '@shopify/ui-extensions-react/checkout';

export default reactExtension(
  'purchase.checkout.shipping-option-list.render-after',
  () => <Extension />,
);

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function Extension() {
  const { query } = useApi();
  const lines = useCartLines();
  const settings = useSettings();
  let cutoffTime = settings.cut_off_time;
  let timezone = settings.timezone;
  let disable_date = settings.disable_date;
  let disable_date_2 = settings.disable_date_2;
  let disable_date_3 = settings.disable_date_3;
  let disable_date_4 = settings.disable_date_4;
  let disable_date_5 = settings.disable_date_5;
  let disable_date_end = settings.disable_date_end;
  let days = settings.multiple_days;
  let deliverDate = settings.deliveryDate;
  let dropShipping = settings.dropShipping;
  let noDelivery = settings.noDelivery;
  const convertedCutOfTime = convertToUTC(cutoffTime);
  let disabledDays = settings.multiple_days.split(',');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [hasShowDatePickerMetafield] = useState("true");
  const appMetafields = useAppMetafields();
  const updateMetafield = useApplyMetafieldsChange();
  const METAFIELD_NAMESPACE = "shipping";
  const METAFIELD_KEY = "requested_shipping_date";
  const requestedShippingDateMetafield = useMetafield({
    namespace: METAFIELD_NAMESPACE,
    key: METAFIELD_KEY,
  });
  let disable_date_date = new Date(disable_date);
  let disable_date_end_date = new Date(disable_date_end);

  let diffTime = Math.abs(disable_date_date-disable_date_end_date);
  let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
 // Extract the offset from the timezone string
 const matches = timezone.match(/UTC\+(\d+)(?::(\d+))?/);
 let offsetHours = 0, offsetMinutes = 0;
 if (matches) {
   offsetHours = parseInt(matches[1]);
   offsetMinutes = matches[2] ? parseInt(matches[2]) : 0;
 }
 const offset = offsetHours + offsetMinutes / 60;


  var newTime = addUTCOffset(offset);
  // Parse cutoff time
  const [cutoffHours, cutoffMinutes] = cutoffTime.split(":").map(str => parseInt(str));

  // Create a new Date object for the current time in the timezone of the extension
  let ctTime = currentTime();
  let currentNewTime = new Date();
  currentNewTime.setHours(cutoffHours, cutoffMinutes, 0, 0); // Set hours and minutes from cutoffTime


  let [products, setProducts] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [yesterday, setYesterday] = useState("");

  // Sets the selected date to today, unless today is Sunday, then it sets it to tomorrow
  useMemo(() => {
    var today = new Date();

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const deliveryDate = today.getDay() === 0 || newTime >= convertedCutOfTime  ? tomorrow : today;

    setSelectedDate(formatDate(deliveryDate));
    setYesterday(formatDate(yesterday));
  }, []);
  const handleCheckboxChange = (isChecked) => {
    setShowDatePicker(isChecked);
    if (!isChecked) {
      updateMetafield({
        type: "removeMetafield",
        namespace: METAFIELD_NAMESPACE,
        key: METAFIELD_KEY,
      });
    }
  };
  // Set a function to handle the Date Picker component's onChange event
  const handleChangeDate = useCallback((selectedDate) => {
    setSelectedDate(selectedDate);
    updateMetafield({
      type: "updateMetafield",
      namespace: METAFIELD_NAMESPACE,
      key: METAFIELD_KEY,
      valueType: "string",
      value: selectedDate,
    });
  }, []);
 let completeDate;
  if(newTime >= convertedCutOfTime){
    var date = new Date(ctTime);
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2); // Add 1 to get the correct month and pad with leading zero
    const day = ('0' + date.getDate()).slice(-2); // Pad with leading zero
    completeDate = `${year}-${month}-${day}`;
  }else{
    "not match";
  }

//fetched products and product tags
useEffect(() => {
  lines.forEach((item) => {
    const productId = item.merchandise.product.id;

    query(
      `query ($id: ID!) {
        product(id: $id) {
          tags
        }
      }`,
      { variables: { id: productId } }
    )
      .then(({ data }) => {
        setProducts(prevProducts => [...prevProducts, data.product.tags]); // Update products array
      })
      .catch(console.error);
  });
}, [lines, query]);

var newArr = [];
  for(var i = 0; i < products.length; i++){
    newArr = newArr.concat(products[i]);
  }

  let uniqueChars = [...new Set(newArr)];

  if(uniqueChars.includes(deliverDate) && !uniqueChars.includes(dropShipping) && !uniqueChars.includes(noDelivery)){
  return (
    <>
      {hasShowDatePickerMetafield === "true" && (
        <>
          <Text size="medium" emphasis="bold">
            Want your order delivered a specific date?
          </Text>
          <Checkbox
            id="showDatePicker"
            name="showDatePicker"
            onChange={handleCheckboxChange}
          >
            Select a target delivery date.
          </Checkbox>
        </>
      )}
      {hasShowDatePickerMetafield === "true" && showDatePicker && (
      <>
        <Heading>Select a date for delivery</Heading>
        <DatePicker
          selected={selectedDate}
          onChange={handleChangeDate}
          disabled={[...disabledDays, { end: yesterday }, completeDate, disable_date, disable_date_2, disable_date_3, disable_date_3, disable_date_4, disable_date_5]}
        />
        </>
      )}
    </>
  )
  }
}

function addUTCOffset(offset) {
  var currentTimeInMillis = Date.now();
  var offsetInMillis = offset * 60 * 60 * 1000;
  var newTimeInMillis = currentTimeInMillis + offsetInMillis;
  var newTime = new Date(newTimeInMillis);
  var newTimeString = newTime.toISOString();
  return newTimeString;
}

function currentTime() {
  const timestamp = Date.now();
  const date = new Date(timestamp);
  const offsetMinutes = date.getTimezoneOffset();
  const offsetMilliseconds = offsetMinutes * 60 * 1000;
  const localTime = new Date(date.getTime() - offsetMilliseconds);
  const isoString = localTime.toISOString();

  return isoString;
}

function convertToUTC(timeString) {
  // Parse the input time string
  const [time, meridiem] = timeString.split(' ');
  let [hours, minutes] = time.split(':').map(num => parseInt(num));
  let isPM = meridiem.toUpperCase() === 'PM';

  // Adjust hours for PM
  if (isPM && hours !== 12) {
      hours += 12;
  }

  // Create a Date object with the provided time in the local time zone
  const localTime = new Date();
  localTime.setHours(hours, minutes, 0); // Set the hours, minutes, and seconds

  // Get the UTC time
  const utcTime = new Date(localTime.getTime() - (localTime.getTimezoneOffset() * 60 * 1000));

  // Format the UTC time as an ISO string
  const isoString = utcTime.toISOString();

  return isoString;
}