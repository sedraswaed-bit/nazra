<?php
// متحكم الرسائل - Message Controller
// الرسائل بين المستخدمين ومالكي العقارات - Messages between users and owners
// منصة نظرة - NAZRA Platform

namespace App\Http\Controllers;

use App\Models\Message;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    // ========== صندوق الوارد - Inbox ==========
    public function inbox(Request $request)
    {
        $messages = Message::where('receiver_id', $request->user()->id)
            ->with(['sender', 'property'])
            ->latest()
            ->paginate(20);

        return response()->json([
            'messages' => $messages,
            'unread_count' => Message::unreadCount($request->user()->id),
        ]);
    }

    // ========== الرسائل المرسلة - Sent messages ==========
    public function sent(Request $request)
    {
        $messages = Message::where('sender_id', $request->user()->id)
            ->with(['receiver', 'property'])
            ->latest()
            ->paginate(20);

        return response()->json($messages);
    }

    // ========== إرسال رسالة - Send message ==========
    public function store(Request $request)
    {
        $data = $request->validate([
            'receiver_id' => 'required|exists:users,id',
            'property_id' => 'nullable|exists:properties,id',
            'subject' => 'nullable|string|max:255',
            'body' => 'required|string|max:2000',
            'parent_id' => 'nullable|exists:messages,id',
        ]);

        $message = Message::create([
            'sender_id' => $request->user()->id,
            'receiver_id' => $data['receiver_id'],
            'property_id' => $data['property_id'] ?? null,
            'subject' => $data['subject'] ?? null,
            'body' => $data['body'],
            'parent_id' => $data['parent_id'] ?? null,
        ]);

        return response()->json([
            'message' => $message->load(['sender', 'receiver', 'property']),
            'info' => 'تم إرسال الرسالة بنجاح' // Message sent
        ], 201);
    }

    // ========== عرض رسالة - Show message ==========
    public function show(Request $request, int $id)
    {
        $message = Message::where(function ($q) use ($request) {
            $q->where('sender_id', $request->user()->id)
              ->orWhere('receiver_id', $request->user()->id);
        })
        ->with(['sender', 'receiver', 'property', 'replies'])
        ->findOrFail($id);

        // تعليم كمقروءة إذا كان المستخدم هو المستقبل - Mark as read if receiver
        if ($message->receiver_id === $request->user()->id && !$message->is_read) {
            $message->markAsRead();
        }

        return response()->json($message);
    }

    // ========== الرد على رسالة - Reply to message ==========
    public function reply(Request $request, int $id)
    {
        $parentMessage = Message::findOrFail($id);

        $data = $request->validate([
            'body' => 'required|string|max:2000',
        ]);

        $reply = Message::create([
            'sender_id' => $request->user()->id,
            'receiver_id' => $parentMessage->sender_id,
            'property_id' => $parentMessage->property_id,
            'subject' => 'Re: ' . ($parentMessage->subject ?? ''),
            'body' => $data['body'],
            'parent_id' => $parentMessage->id,
        ]);

        return response()->json([
            'message' => $reply->load(['sender', 'receiver']),
            'info' => 'تم إرسال الرد' // Reply sent
        ], 201);
    }

    // ========== عدد الرسائل غير المقروءة - Unread count ==========
    public function unreadCount(Request $request)
    {
        return response()->json([
            'unread_count' => Message::unreadCount($request->user()->id),
        ]);
    }
}
